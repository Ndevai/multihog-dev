# Building Pulse for the extension

Pulse (gitlab.kitware.com/physiology/engine, stable 5e29e5b) runs in the extension as WebAssembly. To rebuild:

1. Native build (generates the data and the protobuf bindings): CMake ≥ 3.31, Java, Python.
   `cmake -GNinja -DCMAKE_BUILD_TYPE=Release -DPulse_PYTHON_API=ON -DPulse_JAVA_API=ON -DPulse_GEN_DATA=ON -DCMAKE_POLICY_VERSION_MINIMUM=3.5 ../pulse && ninja`
   If GitHub refuses the pybind11 archive, clone tag v3.0.4, zip it as `pybind11-3.0.4/` and point `cmake/external/External_pybind11.cmake` at `file://…zip` without the MD5 line.
2. WebAssembly build (Emscripten 3.1.74): `emcmake cmake -GNinja -DCMAKE_BUILD_TYPE=Release -DPulse_C_AS_STATIC=ON -DPulse_JAVA_API=OFF -DPulse_PYTHON_API=OFF -DPulse_GEN_DATA=OFF -DPulse_NATIVE_BUILD_DIR=<native build> -DCMAKE_POLICY_VERSION_MINIMUM=3.5 ../pulse && ninja`; in `Innerbuild` set `-DCMAKE_CXX_SCAN_FOR_MODULES=OFF` (Emscripten has no clang-scan-deps) and run ninja there.
3. Link: `em++ -O3 tools/pulse-glue.cpp -Wl,--whole-archive libPulseC.a -Wl,--no-whole-archive libPulse.a libprotobuf.a libutf8_validity.a libutf8_range.a libabsl_*.a -o rules/pulse/pulse.mjs -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=web,worker,node -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=134217728 -sSTACK_SIZE=8388608 -sFORCE_FILESYSTEM=1 -sDISABLE_EXCEPTION_CATCHING=0` with the exported functions listed in `rules/pulse/core.mjs` (PulseInitialize, Allocate, Deallocate, SerializeFromString, ProcessActions, AdvanceTimeS, PullData, malloc, free) and runtime methods FS, stringToNewUTF8, HEAPF64. An 8 MB stack is needed: a state file is 2.4 MB of JSON.
4. Data: copy `install/bin/{substances,config,ecg,environments,nutrition,patients}` to `rules/pulse/data/`, list them in `rules/pulse/files.txt`, and gzip `states/Standard{Male,Female}@0s.json` into `rules/pulse/states/`.
