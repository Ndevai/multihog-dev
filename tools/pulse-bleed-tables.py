# Minute-by-minute Pulse trajectories for one bleeding limb, 60 min, per sex, limb and severity (native PyPulse).
import sys, json, os
B='/tmp/claude-0/-home-claude/1bd7bcb3-68ff-5931-8d4a-6ef781b50745/scratchpad/pulse-native/install/bin'
os.chdir(B); sys.path.insert(0, '.'); sys.path.insert(0, '../python')
from pulse.cdm.engine import SEDataRequestManager, SEDataRequest
from pulse.cdm.patient_actions import SEHemorrhage
from pulse.engine.PulseEngine import PulseEngine
from pulse.cdm.scalars import VolumePerTimeUnit, FrequencyUnit, PressureUnit, VolumeUnit
REQ = [('HeartRate', FrequencyUnit.Per_min), ('MeanArterialPressure', PressureUnit.mmHg), ('SystolicArterialPressure', PressureUnit.mmHg),
       ('DiastolicArterialPressure', PressureUnit.mmHg), ('RespirationRate', FrequencyUnit.Per_min), ('OxygenSaturation', None),
       ('TotalHemorrhageRate', VolumePerTimeUnit.mL_Per_min), ('TotalHemorrhagedVolume', VolumeUnit.mL)]
jobs = sys.argv[1:]   # e.g. Male:Leg:0.5
for job in jobs:
    sex, limb, sev = job.split(':'); sev = float(sev)
    out = f'/tmp/claude-0/-home-claude/1bd7bcb3-68ff-5931-8d4a-6ef781b50745/scratchpad/tables/{sex}_{limb}_{sev:.1f}.json'
    if os.path.exists(out): continue
    p = PulseEngine(); p.log_to_console(False)
    reqs = [SEDataRequest.create_physiology_request(n, unit=u) if u else SEDataRequest.create_physiology_request(n) for n, u in REQ]
    assert p.serialize_from_file(f'./states/Standard{sex}@0s.json', SEDataRequestManager(reqs))
    h = SEHemorrhage(); h.set_compartment(f'Right{limb}'); h.get_severity().set_value(sev); p.process_action(h)
    rows = []
    for m in range(60):
        if not p.advance_time_s(60): break
        r = p.pull_data(); rows.append([round(float(x), 2) for x in r[1:]])
    json.dump(rows, open(out, 'w'))
    print(job, len(rows), rows[-1] if rows else None, flush=True)
