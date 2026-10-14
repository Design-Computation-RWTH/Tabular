/**
 * Node for editing metadata about each detected spreadsheet column.
 * Descriptions can be typed or assigned from TerminologyNode, units are
 * assigned from UnitNode, and every change is sent upward for RDF serialization.
 * When a Terminology Service or Units node is connected, the description and
 * unit fields also offer type-to-search autocomplete next to drag-and-drop.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import tabularSchemaIcon from '../assets/tabular_schema.png';
import { searchTerminologyTerms } from '../services/terminologyApi';
import { queryUnits } from '../services/qudtService';
import {
  deleteBrowserDraft,
  readBrowserDraft,
  writeBrowserDraft,
} from '../services/browserDrafts';
import NodeHandle from './NodeHandle';
import NodeInfoButton from './NodeInfoButton';

const UNIT_DRAG_MIME_TYPE = 'application/tabulatrdm-unit';
const TERM_DRAG_MIME_TYPE = 'application/tabulatrdm-term';
const SUGGESTION_DEBOUNCE_MS = 300;
const MIN_SUGGESTION_QUERY_LENGTH = 2;
const MAX_SUGGESTIONS = 8;
const annotationDraftStoragePrefix = 'tabular-rdm.column-annotations-draft.v1';
const ANNOTATION_SAVE_DELAY_MS = 400;

export default function ColumnDescriptionNode({ id, data, selected, onFieldsChange }) {
  const fields = Array.isArray(data.fields) ? data.fields : [];
  const hasFields = fields.length > 0;
  const hasTerminologyInput = data.terminologyInput === true;
  const unitInput = data.unitInput ?? null;
  const language = data.language ?? 'en';
  const storageKey = `${annotationDraftStoragePrefix}:${id}`;
  const [storedDraft, setStoredDraft] = useState(() => readBrowserDraft(storageKey));
  const rememberAnnotations = storedDraft?.enabled === true;
  const [storageError, setStorageError] = useState('');
  const saveTimerRef = useRef(null);
  const pendingFieldsRef = useRef(null);
  const restoredHeadersRef = useRef(null);
  // { index, kind: 'description' | 'unit' } of the field the user is typing in.
  const [activeField, setActiveField] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState('');
  // Suppresses the immediate re-search that follows a suggestion commit, so the
  // panel does not reopen with results for the just-inserted value.
  const skipSuggestionSearchRef = useRef(false);

  const saveAnnotations = useCallback((nextFields) => {
    const draft = {
      enabled: true,
      headers: nextFields.map((field) => field.header),
      fields: nextFields,
    };

    try {
      writeBrowserDraft(storageKey, draft);
      setStoredDraft(draft);
      setStorageError('');
    } catch {
      setStorageError('Column annotations could not be saved in this browser.');
    }
  }, [storageKey]);

  const flushPendingAnnotations = useCallback(() => {
    window.clearTimeout(saveTimerRef.current);
    if (pendingFieldsRef.current) {
      saveAnnotations(pendingFieldsRef.current);
      pendingFieldsRef.current = null;
    }
  }, [saveAnnotations]);

  useEffect(() => {
    if (!rememberAnnotations || !hasFields) return;

    const headers = fields.map((field) => field.header);
    const headersKey = JSON.stringify(headers);
    if (restoredHeadersRef.current === headersKey) return;
    restoredHeadersRef.current = headersKey;

    if (
      JSON.stringify(storedDraft?.headers) !== headersKey ||
      !Array.isArray(storedDraft?.fields) ||
      fields.some((field) => field.description || field.descriptionUri || field.unit || field.unitUri)
    ) {
      return;
    }

    const restoredFields = fields.map((field, index) => ({
      ...field,
      description: storedDraft.fields[index]?.description ?? '',
      descriptionUri: storedDraft.fields[index]?.descriptionUri ?? '',
      descriptionLanguage: storedDraft.fields[index]?.descriptionLanguage ?? '',
      unit: storedDraft.fields[index]?.unit ?? '',
      unitUri: storedDraft.fields[index]?.unitUri ?? '',
      unitLanguage: storedDraft.fields[index]?.unitLanguage ?? '',
    }));
    onFieldsChange(id, restoredFields);
  }, [fields, hasFields, id, onFieldsChange, rememberAnnotations, storedDraft]);

  useEffect(() => {
    if (!rememberAnnotations) return undefined;
    const onPageHide = () => flushPendingAnnotations();
    window.addEventListener('pagehide', onPageHide);
    return () => {
      flushPendingAnnotations();
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [flushPendingAnnotations, rememberAnnotations]);

  const commitFields = useCallback((nextFields) => {
    onFieldsChange(id, nextFields);
    if (rememberAnnotations) {
      pendingFieldsRef.current = nextFields;
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(flushPendingAnnotations, ANNOTATION_SAVE_DELAY_MS);
    }
  }, [flushPendingAnnotations, id, onFieldsChange, rememberAnnotations]);

  const removeSavedAnnotations = useCallback(() => {
    window.clearTimeout(saveTimerRef.current);
    pendingFieldsRef.current = null;
    try {
      deleteBrowserDraft(storageKey);
      setStoredDraft(null);
      setStorageError('');
    } catch {
      setStorageError('Saved annotations could not be removed from this browser.');
    }
  }, [storageKey]);

  const handleRememberChange = useCallback((event) => {
    if (event.target.checked) {
      restoredHeadersRef.current = JSON.stringify(fields.map((field) => field.header));
      saveAnnotations(fields);
    } else {
      removeSavedAnnotations();
    }
  }, [fields, removeSavedAnnotations, saveAnnotations]);

  const handleDescriptionChange = useCallback(
    (index, description, descriptionUri = '', descriptionLanguage = '') => {
      const nextFields = fields.map((field, fieldIndex) =>
        fieldIndex === index
          ? { ...field, description, descriptionUri, descriptionLanguage }
          : field,
      );
      commitFields(nextFields);
    },
    [commitFields, fields],
  );

  const handleUnitChange = useCallback(
    (index, unit, unitUri = '', unitLanguage = '') => {
      const nextFields = fields.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, unit, unitUri, unitLanguage } : field,
      );
      commitFields(nextFields);
    },
    [commitFields, fields],
  );

  const fetchTerminologySuggestions = useCallback(
    async (query, signal) => {
      const { terms } = await searchTerminologyTerms({
        query,
        language,
        limit: MAX_SUGGESTIONS,
        signal,
      });

      return terms.map((term) => ({
        key: term.iri,
        label: term.label || term.iri,
        secondary: term.curie || term.ontologyPrefix || term.iri,
        payload: {
          description: term.label || term.iri,
          descriptionUri: term.iri,
          descriptionLanguage: term.language || language || '',
        },
      }));
    },
    [language],
  );

  // The QUDT store is cached after the first load, so suggestions are filtered
  // client-side. A quantity kind filter from the connected Units node narrows
  // the results; when it excludes everything, text matches are still offered.
  const fetchUnitSuggestions = useCallback(
    async (query) => {
      const units = await queryUnits();
      const normalizedQuery = query.toLocaleLowerCase();
      const quantityKindFilter = unitInput?.quantityKindFilter || '';
      const textMatches = units.filter(
        (unit) =>
          unit.labelLanguage === language &&
          unit.label.toLocaleLowerCase().includes(normalizedQuery),
      );
      const filteredMatches = quantityKindFilter
        ? textMatches.filter((unit) => unit.quantityKinds?.includes(quantityKindFilter))
        : textMatches;

      return (filteredMatches.length > 0 ? filteredMatches : textMatches).map((unit) => ({
        key: `${unit.unit}\n${unit.label}\n${unit.labelLanguage}`,
        label: unit.label || unit.unit,
        secondary: unit.unit.replace(/^.*[/#]/, ''),
        payload: {
          unit: unit.label || unit.unit,
          unitUri: unit.unit,
          unitLanguage: unit.labelLanguage || language || '',
        },
      }));
    },
    [language, unitInput],
  );

  useEffect(() => {
    if (!activeField) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      setSuggestionError('');
      return undefined;
    }

    if (skipSuggestionSearchRef.current) {
      skipSuggestionSearchRef.current = false;
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      setSuggestionError('');
      return undefined;
    }

    const field = fields[activeField.index];
    const query = String(field?.[activeField.kind] ?? '').trim();
    const serviceConnected =
      activeField.kind === 'description' ? hasTerminologyInput : Boolean(unitInput);

    if (query.length < MIN_SUGGESTION_QUERY_LENGTH || !serviceConnected) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      setSuggestionError('');
      return undefined;
    }

    const controller = new AbortController();

    const timeoutId = window.setTimeout(() => {
      setIsLoadingSuggestions(true);
      setSuggestionError('');

      const request =
        activeField.kind === 'description'
          ? fetchTerminologySuggestions(query, controller.signal)
          : fetchUnitSuggestions(query);

      request
        .then((results) => {
          setSuggestions(results.slice(0, MAX_SUGGESTIONS));
        })
        .catch((error) => {
          if (error?.name !== 'AbortError') {
            setSuggestions([]);
            setSuggestionError(error?.message || 'Could not load suggestions.');
          }
        })
        .finally(() => {
          setIsLoadingSuggestions(false);
        });
    }, SUGGESTION_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    activeField,
    fetchTerminologySuggestions,
    fetchUnitSuggestions,
    fields,
    hasTerminologyInput,
    unitInput,
  ]);

  const applySuggestion = useCallback(
    (suggestion) => {
      if (!activeField) {
        return;
      }

      if (activeField.kind === 'description') {
        handleDescriptionChange(
          activeField.index,
          suggestion.payload.description,
          suggestion.payload.descriptionUri,
          suggestion.payload.descriptionLanguage,
        );
      } else {
        handleUnitChange(
          activeField.index,
          suggestion.payload.unit,
          suggestion.payload.unitUri,
          suggestion.payload.unitLanguage,
        );
      }

      // Keep the field active so further typing refines the search; only the
      // immediate re-search for the committed value is skipped above.
      skipSuggestionSearchRef.current = true;
      setSuggestions([]);
    },
    [activeField, handleDescriptionChange, handleUnitChange],
  );

  const beginFieldSearch = useCallback(
    (index, kind) => {
      const enabled = kind === 'description' ? hasTerminologyInput : Boolean(unitInput);
      setActiveField(enabled ? { index, kind } : null);
    },
    [hasTerminologyInput, unitInput],
  );

  const handleDropTargetDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDescriptionDrop = useCallback(
    (event, index) => {
      const rawTerm = event.dataTransfer.getData(TERM_DRAG_MIME_TYPE);

      if (!rawTerm) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      try {
        const term = JSON.parse(rawTerm);
        handleDescriptionChange(
          index,
          term.label || term.iri || '',
          term.iri || '',
          term.language || '',
        );
      } catch {
        // Ignore malformed internal drag payloads.
      }
    },
    [handleDescriptionChange],
  );

  const handleUnitDrop = useCallback(
    (event, index) => {
      // Only accept the structured payload emitted by Unit nodes so a dragged
      // terminology concept cannot accidentally be assigned as a unit.
      const rawUnit = event.dataTransfer.getData(UNIT_DRAG_MIME_TYPE);

      if (!rawUnit) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      try {
        const unit = JSON.parse(rawUnit);
        handleUnitChange(
          index,
          unit.label || unit.uri || '',
          unit.uri || '',
          unit.language || '',
        );
      } catch {
        // Ignore malformed internal drag payloads.
      }
    },
    [handleUnitChange],
  );

  return (
    <div className={`column-description-node${selected ? ' selected' : ''}`}>
      <NodeHandle
        type="target"
        accepts={['Tabular file', 'Terminology Service', 'Units']}
      />
      <div className="column-description-node__header">
        <img src={tabularSchemaIcon} alt="" className="column-description-node__icon" />
        <p className="column-description-node__title">{data.label}</p>
      </div>

      {hasFields ? (
        <div className={`column-description-node__table-wrap${
          fields.length > 10 ? ' column-description-node__table-wrap--scrollable nodrag nopan nowheel' : ''
        }`}>
          <table className="column-description-node__table">
            <thead>
              <tr>
                <th>Header</th>
                <th>Column Description</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={`${field.header || 'header'}-${index}`}>
                  <td>{field.header || `Column ${index + 1}`}</td>
                  <td
                    className="column-description-node__description-cell"
                    onDragOver={handleDropTargetDragOver}
                    onDrop={(event) => handleDescriptionDrop(event, index)}
                  >
                    <input
                      type="text"
                      className={`column-description-node__input${
                        field.descriptionUri ? ' column-description-node__linked-input' : ''
                      }`}
                      value={field.description ?? ''}
                      onChange={(event) => handleDescriptionChange(index, event.target.value)}
                      onFocus={() => beginFieldSearch(index, 'description')}
                      onBlur={() => setActiveField(null)}
                      onDragOver={handleDropTargetDragOver}
                      onDrop={(event) => handleDescriptionDrop(event, index)}
                      title={field.descriptionUri || undefined}
                      placeholder={
                        hasTerminologyInput
                          ? 'Type to search, or drag a concept'
                          : 'Type or drag a terminology concept'
                      }
                    />
                  </td>
                  <td
                    className="column-description-node__unit-cell"
                    onDragOver={handleDropTargetDragOver}
                    onDrop={(event) => handleUnitDrop(event, index)}
                  >
                    <input
                      type="text"
                      className="column-description-node__input column-description-node__unit-input"
                      value={field.unit ?? ''}
                      readOnly={!unitInput}
                      onChange={(event) => handleUnitChange(index, event.target.value)}
                      onFocus={() => beginFieldSearch(index, 'unit')}
                      onBlur={() => setActiveField(null)}
                      onDragOver={handleDropTargetDragOver}
                      onDrop={(event) => handleUnitDrop(event, index)}
                      title={field.unitUri || undefined}
                      placeholder={
                        unitInput ? 'Type to search, or drag a unit' : 'Drag a unit from Units'
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="column-description-node__empty">No headers available</p>
      )}

      {activeField &&
      (suggestions.length > 0 || isLoadingSuggestions || suggestionError) ? (
        <div className="column-description-node__suggestions nodrag nopan" role="listbox">
          {suggestionError ? (
            <p className="column-description-node__suggestion-status">
              {suggestionError}
            </p>
          ) : isLoadingSuggestions ? (
            <p className="column-description-node__suggestion-status">Searching...</p>
          ) : (
            <ul>
              {suggestions.map((suggestion) => (
                <li key={suggestion.key}>
                  <button
                    type="button"
                    className="column-description-node__suggestion"
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => applySuggestion(suggestion)}
                  >
                    <span className="column-description-node__suggestion-label">
                      {suggestion.label}
                    </span>
                    <span className="column-description-node__suggestion-secondary">
                      {suggestion.secondary}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <p className="column-description-node__status">
        {hasFields ? 'Column descriptions update RDF automatically' : 'No RDF to create yet'}
        {unitInput?.quantityKindLabel
          ? `. Unit suggestions filtered by ${unitInput.quantityKindLabel}`
          : ''}
      </p>

      <div className="column-description-node__browser-storage nodrag">
        <label
          className="column-description-node__remember"
          title="Unchecking deletes saved annotations from this browser."
        >
          <input
            type="checkbox"
            checked={rememberAnnotations}
            onChange={handleRememberChange}
            aria-description="Unchecking deletes saved annotations from this browser."
          />
          Remember column annotations in this browser
        </label>
        {rememberAnnotations ? (
          <button type="button" onClick={removeSavedAnnotations}>
            Delete saved browser copy
          </button>
        ) : null}
        {storageError ? <p role="alert">{storageError}</p> : null}
      </div>

      <NodeInfoButton
        nodeType={data.infoNodeType || 'columnDescription'}
        language={data.language}
      />
      <NodeHandle type="source" connectsTo={['RO-Crate']} />
    </div>
  );
}
