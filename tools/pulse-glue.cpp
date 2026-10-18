// Calls the extension makes into Pulse: advance many steps in one call, and free strings Pulse allocated.
#include <cstdlib>
#include <cmath>
class PhysiologyEngineThunk;
extern "C" bool AdvanceTimeStep(PhysiologyEngineThunk*);
extern "C" double GetTimeStep(PhysiologyEngineThunk*, const char*);
extern "C" bool AdvanceTimeS(PhysiologyEngineThunk* t, double seconds) {
  const double dt = GetTimeStep(t, "s");
  const long n = std::lround(seconds / dt);
  for (long i = 0; i < n; ++i) if (!AdvanceTimeStep(t)) return false;
  return true;
}
extern "C" void FreeString(char* s) { std::free(s); }
