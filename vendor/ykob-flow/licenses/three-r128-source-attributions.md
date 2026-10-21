# Three r128 source attributions and upstream adaptations

Prepared for this distribution on 2026-10-12. This is a supplementary notice,
not an original Three or upstream NOTICE file. Three r128's publisher license
is retained in [three-r128-MIT.txt](three-r128-MIT.txt). The compiled author
bundle is distributed byte-for-byte; this project did not modify these ports.
The transformations described below were already present in Three r128.

## MathGeoLib

Three's [Sphere.js](https://github.com/mrdoob/three.js/blob/r128/src/math/Sphere.js)
identifies `expandByPoint` and `union` as adaptations of the C++ sphere
enclosure routines at lines 649–671 and 759–769 of
[MathGeoLib Sphere.cpp, commit 2940b99b99cfe575dd45103ef20f4019dee15b54](https://github.com/juj/MathGeoLib/blob/2940b99b99cfe575dd45103ef20f4019dee15b54/src/Geometry/Sphere.cpp).
The adaptation uses JavaScript and Three's vector types/methods in place of
MathGeoLib's C++ types. The upstream header reads:

> Copyright Jukka Jylänki
>
> Licensed under the Apache License, Version 2.0 (the "License");
> you may not use this file except in compliance with the License.
> You may obtain a copy of the License at
>
> http://www.apache.org/licenses/LICENSE-2.0
>
> Unless required by applicable law or agreed to in writing, software
> distributed under the License is distributed on an "AS IS" BASIS,
> WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
> See the License for the specific language governing permissions and
> limitations under the License.

The full license is in [Apache-2.0.txt](Apache-2.0.txt). No copyright year is
added. A direct check of `/NOTICE` at the cited MathGeoLib commit returned
HTTP 404 on 2026-10-12; this is not a claim about all files in that repository.

## Filament

Three's [bsdfs.glsl.js](https://github.com/mrdoob/three.js/blob/r128/src/renderers/shaders/ShaderChunk/bsdfs.glsl.js)
links `D_Charlie` and `V_Neubelt` to Google Filament's `shaders/src/brdf.fs`.
The historical [v1.9.25 source](https://github.com/google/filament/blob/v1.9.25/shaders/src/brdf.fs)
contains those two functions and their research citations. This is a
historical comparison reference, not an assertion that v1.9.25 was the exact
commit originally copied by Three.

Three's `V_Neubelt` uses Three's `saturate` helper where the historical
reference uses `saturateMediump`, and the functions are incorporated into
Three's `USE_SHEEN` shader branch. The cited reference file contains no separate
copyright header. We attribute this portion to the Filament project and
retain its [Apache 2.0 license](filament-Apache-2.0.txt), obtained from the
[v1.9.25 publisher LICENSE](https://github.com/google/filament/blob/v1.9.25/LICENSE).
A direct check of `/NOTICE` at that tag returned HTTP 404 on 2026-10-12; no
copyright year or nonexistent NOTICE is invented.

Research citations retained with these functions:

- Estevez and Kulla, 2017, *Production Friendly Microfacet Sheen BRDF*.
- Neubelt and Pettineo, 2013, *Crafting a Next-gen Material Pipeline for The Order: 1886*.

## Earcut and LTC / ACES

Three's [Earcut.js](https://github.com/mrdoob/three.js/blob/r128/src/extras/Earcut.js)
identifies its Earcut v2.2.2 port. Copyright (c) 2016, Mapbox. Its complete
ISC terms are retained in [earcut-2.2.2-ISC.txt](earcut-2.2.2-ISC.txt).

Three's LTC shader and ACES tone-mapping source cite
[selfshadow/ltc_code](https://github.com/selfshadow/ltc_code). Copyright (c)
2017, Eric Heitz, Jonathan Dupuy, Stephen Hill and David Neubelt. All rights
reserved. The full terms, disclaimer and required paper reference are retained
in [ltc-code-BSD-attribution.txt](ltc-code-BSD-attribution.txt). The reference is:

*Real-Time Polygonal-Light Shading with Linearly Transformed Cosines.* Eric
Heitz, Jonathan Dupuy, Stephen Hill and David Neubelt. ACM Transactions on
Graphics (Proceedings of ACM SIGGRAPH 2016) 35(4), 2016.
[Project page](https://eheitzresearch.wordpress.com/415-2/).

## Triangle algorithm reference

Three's [Triangle.closestPointToPoint](https://github.com/mrdoob/three.js/blob/r128/src/math/Triangle.js)
credits the algorithm in *Real-Time Collision Detection*, Christer Ericson,
Morgan Kaufmann Publishers, (c) 2005 Elsevier Inc., chapter 5.1.5, and refers to
an accompanying license. This attribution is retained here. The
[author's companion site](https://realtimecollisiondetection.net/books/rtcd/)
did not establish that license in the material reviewed. No book text or
separate companion code has been imported by this project.

This is a documented limitation of historical tracing, not evidence that the
publisher's MIT-licensed Three distribution has a noncommercial, copyleft or
permission-request condition. This distribution relies on Three r128's
express publisher MIT license and retains the available attribution. It does
not assert that the book itself is MIT licensed, nor that every citation of
a mathematical algorithm establishes a separately licensed code dependency.
