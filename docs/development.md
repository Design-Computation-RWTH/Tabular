# Development and releases

This page is for contributors. Researchers using the application should begin
with the [quick-start tutorial](../README.md).

## Run the development application

Use a current Node.js LTS release:

```sh
npm install
npm run dev
```

Open <http://localhost:5173/>.

## Test the production bundle

```sh
npm run build
npm run serve
```

Open <http://localhost:4173/>. To build the web bundle and launch Electron
during development, run:

```sh
npm run desktop
```

A Vite warning about chunks larger than 500 kB is expected because spreadsheet,
RDF, RO-Crate, and ZIP libraries are sizeable. It is not a build failure.

## Build a Windows release

On a Windows build machine:

```sh
npm ci
npm run dist:windows
```

Artifacts are written to `release/`. Public executables should be signed with
the institution's code-signing certificate and tested on clean Windows 10 and
Windows 11 systems using a non-administrator account.

## Code map

- `src/App.jsx` defines the canvas, connections, parsing, and data propagation.
- `src/nodes/` contains workflow node interfaces.
- `src/services/` contains metadata, vocabulary, RDF, RO-Crate, and Coscine
  logic.
- `server.js` serves the production bundle and provides loopback-only service
  proxies.
- `electron/main.js` starts the local server and desktop window.

## Check a change

Before handing off a change:

1. Run `npm run build`.
2. Exercise the affected workflow in the browser or Electron application.
3. Confirm that local data is not sent to an external service unexpectedly.
4. Update the relevant task page when user-visible behavior changes.

---

[Documentation guide](README.md) · [Repository README](../README.md)
