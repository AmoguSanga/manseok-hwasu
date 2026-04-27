# Discover 3D Model Slot

The live discovery scene loads `manseok-hwasu-map.glb` from this folder.

Suggested export settings:
- Format: GLB 2.0
- Units: meters
- Origin: center of the map
- Approximate footprint: 10 units wide by 6 units deep
- Keep the ground plane close to `y = 0`
- Keep indicator cubes named after the pin ids: `waterfront`, `lookout`, `library`, `cafe`, `gallery`, `bike`

`js/discover-3d.js` hides those indicator cubes at runtime and projects the HTML pins slightly above their positions. If you move a cube in the 3D file and re-export the GLB, the corresponding pin moves with it.
