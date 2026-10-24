# Project 2 Checkpoint: Cube World

## 1. Plan

### Theme: Mission Control (Space / NASA)

A WebGL2 world made entirely from the single 2x2x2 cube model. The ground is a cratered lunar (or Martian) surface seen from an orbiting "satellite flyover" camera. The sky above it holds cube-built space objects that fly along Bezier curves.

### Design by Level

| Level | Plan |
|---|---|
| **0** | WebGL2 page with a header (title, my name, project info) and a single 2x2x2 cube. |
| **1a/b** | A grid of cubes on the x-z plane (translation). Heights come from a crater/ridge procedure, with crater rims high and crater floors low (y-scaling). I'll try several grid sizes and check performance. |
| **1c** | Vertex colors from a procedure (pale regolith on top, darker toward the base and crater floors). The fragment shader interpolates between the vertices. |
| **1d** | Camera orbits the landscape and always looks at (0,0,0), like a satellite circling the landing site. |
| **2** | Real NASA lunar topography as the grayscale heightmap, plus a matching lunar color image. I'll sample both onto the grid. A resolution selector starts low and steps up to the target resolution, with a note that the app needs a performant computer. |
| **3** | Cube-built astronaut, satellite / space station, and asteroids, each moving along its own Bezier curve. Objects that drift too far disappear and respawn at their start point. I'll describe the cubic Bezier function in my documentation. |
| **4** | Starfield skybox, a directional "sun" light for long crater shadows, a thin horizon atmosphere glow, and a distant Earth or ringed planet. Stretch idea: a realistic / cartoon style toggle (see below). |

### Experience

The viewer sees a quiet, moody lunar landscape lit by a harsh low sun while the camera slowly circles it. Overhead, a blocky astronaut tumbles along a lazy Bezier loop, a satellite sweeps a wide arc, and asteroids drift past and then loop back. The satellite and asteroids are stretch goals.

### Look: Realistic vs. Cartoon

My main direction is the **realistic NASA-photo look** (gray/tan regolith, one harsh sun, black starfield). As a Level 4 experiment I may add a **cartoon style toggle** that swaps the palette to saturated colors, quantizes heights into chunky terraces, and bands the lighting into 2-3 flat "toon" steps. It is mostly shader and palette changes.

---

## 2. Sketches and Inspiration

![Project 2 Sketch](/projects/project2/images/project2-checkpoint-sketch-1.jpg)
- Inspiration Image 1: a voxel diorama with a tall mountain, river, trees and buildings, where the color image drives the look and the height varies across the grid (the look I want from the Level 2 terrain, with a space palette instead). Source: https://medium.com/design-bootcamp/voxelish-1-the-valley-cf7aad043c6c
- Inspiration Image 2: a grayscale voxel terrain block built from a heightmap, with stepped cube columns and strong shading from the lighting (the look I want from the Level 2 heightmap sampling and Level 4 lighting, and close to how a lunar surface could read). Source: https://github.com/lachlanmcdonald/magicavoxel-shaders/wiki/Heightmap
- Reference for style and structure: `webgl-cubes-v2` is a great example that I will be taking inspiration from.

## 3. Image Sources (Level 2)

Both images come from NASA's **CGI Moon Kit** (NASA's Scientific Visualization Studio): https://svs.gsfc.nasa.gov/4720

- **Height map:** LOLA lunar elevation data, converted to a grayscale PNG.
  - Starter (1024x512, 8-bit grayscale): https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_3_8bit.jpg
  - Higher-res options: `ldem_4_uint.tif` (1440x720) and `ldem_16_uint.tif` (5760x2880), both 16-bit TIFFs in the same folder.
- **Color image:** matching LROC lunar color map.
  - Starter (1024x512): https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_1k.jpg
  - Higher-res options: `lroc_color_poles_4k.tif` (4096x2048) and `lroc_color_poles_8k.tif` (8192x4096).
- **Plan:** both maps cover the whole Moon in the same flat layout, so they line up. I'll crop the same crater-rich region out of both, convert to PNG, and use the starter pair first, then the higher-res pair for the resolution selector.
- **Credit:** "NASA's Scientific Visualization Studio". The page states no explicit license and links to NASA's reproduction guidelines (https://www.nasa.gov/multimedia/guidelines). The color map is optimized for aesthetics, not science. I'll credit these in the documentation.
- Backup if needed: Mars MOLA topography.

---

## 4. How It's Going

**Status: design is done and the starter code is in my repo; Project 2 coding has not started yet.**

- Done: finalized the theme and design plan for all five levels, chose the image-data approach, and planned the sky objects and Bezier paths.
- Done: added the `webgl-cubes-v2` example code to my `project2` folder as a starting point.
- Done: found and chose the NASA image sources (see Section 3).
- Not started: Level 0 onward. I haven't modified the project 2 example code yet.
- Open items: download the images, crop a matching region from both, convert to PNG, and pick the grid resolutions to test.

**Next Steps**
1. Read through `webgl-cubes-v2` and get a single 2x2x2 cube plus the header working (Level 0).
2. Build the cube grid with procedural crater heights and vertex colors (Level 1a-c).
3. Add the orbiting look-at camera (Level 1d).
4. Download and crop the NASA images, then add image sampling with a resolution selector (Level 2).
5. Build the Bezier sky objects (Level 3), then lighting / skybox extras (Level 4).