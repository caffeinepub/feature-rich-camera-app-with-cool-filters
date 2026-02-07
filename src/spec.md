# Specification

## Summary
**Goal:** Add in-app video recording to the Camera, persist recorded videos locally, and enable gallery playback and export.

**Planned changes:**
- Add a Video capture mode on the Camera screen with Start/Stop recording controls, recording state UI (e.g., indicator/elapsed time), and graceful handling when recording isn’t supported.
- Save recorded videos locally in browser storage alongside existing photos, including updating storage usage calculations without impacting existing saved photos.
- Update the Gallery to display videos distinctly from photos, support video playback in a detail view, allow video download/export, and support deleting individual videos and clearing all media.
- Update the Help modal copy (English) to explain how to record videos, where they are stored locally, and how to export them.

**User-visible outcome:** Users can switch to Video mode, record and save videos, see them in the gallery after refresh, play them back with standard controls, download/export them, and manage them (delete/clear) like photos.
