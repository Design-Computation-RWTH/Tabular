/**
 * Node that packages connected metadata and tabular sheet exports into an
 * RO-Crate ZIP. It reads optional dataset settings from an export_config sheet.
 */
import { useCallback, useEffect, useState } from 'react';
import roCrateLogo from '../assets/RO-Crate.png';
import { createROCratePackage } from '../services/roCrateExport';
import { countTurtleTriplesInWorker } from '../services/rdfTripleCountService';
import NodeHandle from './NodeHandle';
import NodeInfoButton from './NodeInfoButton';

export default function ROCrateNode({ data, selected }) {
  const [tripleCount, setTripleCount] = useState(0);
  const [rdfStatus, setRdfStatus] = useState('Waiting for RDF from a connected node.');
  const [rdfError, setRdfError] = useState('');
  const turtleContent = data.jsonLdContent?.jsonLd?.trim() || '';

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const updateTripleCount = async () => {
      try {
        if (!turtleContent) {
          setTripleCount(0);
          setRdfError('');
          setRdfStatus('Waiting for RDF from a connected node.');
          return;
        }

        setRdfStatus('Checking RDF in background...');
        setRdfError('');
        const count = await countTurtleTriplesInWorker(turtleContent, {
          signal: controller.signal,
        });

        if (isActive) {
          setTripleCount(count);
          setRdfStatus(`Loaded ${count} triple${count === 1 ? '' : 's'}.`);
        }
      } catch (error) {
        if (isActive && error?.name !== 'AbortError') {
          setTripleCount(0);
          setRdfError(error?.message || 'Unable to load RDF content.');
          setRdfStatus('');
        }
      }
    };

    updateTripleCount();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [turtleContent]);

  /**
   * Implements the RO-Crate download template:
   * metadata.ttl contains connected Turtle RDF, workbook sheets become CSV files,
   * and export_config can override dataset metadata.
   */
  const handleCrateDownload = useCallback(async () => {
    if (!data.jsonLdContent?.jsonLd) {
      return;
    }

    const cratePackage = await createROCratePackage({
      jsonLdContent: data.jsonLdContent,
      sheets: data.sheets,
    });
    const url = URL.createObjectURL(cratePackage.blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = cratePackage.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [data.jsonLdContent, data.sheets]);

  const canDownload = Boolean(data.jsonLdContent?.jsonLd);

  return (
    <div className={`ro-crate-node${selected ? ' selected' : ''}`}>
      <NodeHandle
        type="target"
        accepts={[
          'Tabular file',
          'Preview Tabular Data',
          'Column Descriptions',
          'Metadata Form',
        ]}
      />
      <div className="ro-crate-node__header">
        <img src={roCrateLogo} alt="" className="ro-crate-node__icon" />
        <p className="ro-crate-node__title">{data.label}</p>
      </div>
      <p className="rdf-node__count">{tripleCount} triples in RO-Crate</p>
      {rdfStatus ? <p className="ro-crate-node__status">{rdfStatus}</p> : null}
      {rdfError ? <p className="rdf-node__error">{rdfError}</p> : null}
      <button
        type="button"
        className="ro-crate-node__button nodrag"
        disabled={!canDownload}
        onClick={handleCrateDownload}
      >
        Download RO-Crate
      </button>
      <NodeInfoButton nodeType="roCrate" language={data.language} />
      <NodeHandle type="source" connectsTo={['Coscine']} />
    </div>
  );
}
