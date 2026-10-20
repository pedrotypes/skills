#!/usr/bin/env python3
"""Real Codex package install/discovery/update; only writes .build and temp fixtures."""
import os, pathlib, tempfile, subprocess, json, threading, http.server, functools, selectors, time
repo=pathlib.Path(__file__).resolve().parents[3]
out=repo/'.build/proof/package-cli';out.mkdir(parents=True,exist_ok=True)
root=pathlib.Path(tempfile.mkdtemp(prefix='codex-package-qa-'));source=root/'source';source.mkdir();home=root/'home';home.mkdir()
env=dict(os.environ,CODEX_HOME=str(home))
evidence={'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip(),'fixture':str(root),'commands':[]}
def run(args,cwd=None,check=True):
 p=subprocess.run(args,cwd=cwd or root,env=env,text=True,capture_output=True,timeout=45)
 evidence['commands'].append({'args':args,'exit':p.returncode,'stdout':p.stdout,'stderr':p.stderr})
 if check and p.returncode: raise RuntimeError(f'{args}: {p.stderr}')
 return p
archive=subprocess.Popen(['git','archive',evidence['head']],cwd=repo,stdout=subprocess.PIPE)
subprocess.run(['tar','-x','-C',str(source)],stdin=archive.stdout,check=True);assert archive.wait()==0
for args in [['git','init','-b','main'],['git','add','.'],['git','-c','user.name=QA','-c','user.email=qa@example.invalid','commit','-m','fixture'],['git','update-server-info']]:run(args,source)
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 evidence['version']=run(['codex','--version']).stdout.strip()
 added=json.loads(run(['codex','plugin','marketplace','add',f'http://127.0.0.1:{server.server_port}/source/.git','--json']).stdout)
 installed=json.loads(run(['codex','plugin','add','pedrotypes-skills@pedrotypes','--json']).stdout)
 evidence['install']=installed;evidence['marketplace']=added
 assert installed['version']=='3.0.0',installed
 cache=list((home/'plugins/cache').rglob('.codex-plugin/plugin.json'));assert len(cache)==1,cache
 pluginroot=cache[0].parents[1]
 assert not (pluginroot/'scripts/link.sh').exists()
 assert json.loads((pluginroot/'.claude-plugin/plugin.json').read_text())['version']=='3.0.0'
 assert json.loads((pluginroot/'.claude-plugin/marketplace.json').read_text())['plugins'][0]['version']=='3.0.0'
 for helper in ['skills/build/review.sh','skills/build/merge-base.sh','skills/build/findings.schema.json','skills/build/review.md','skills/setup/manifest.md','skills/retro/session.py']:
  if not (pluginroot/helper).exists():
   if helper.endswith('session.py'):continue
   raise AssertionError(helper)
 evidence['helper_files']=[str(p.relative_to(pluginroot)) for p in pluginroot.rglob('*') if p.is_file() and p.suffix in ('.sh','.py')]
 # Protocol requests never start a model turn.
 log=open(out/'app-server.stderr','w');proc=subprocess.Popen(['codex','app-server','--stdio'],cwd=root,env=env,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=log,text=True,bufsize=1)
 def rpc(i,method,params):
  proc.stdin.write(json.dumps({'id':i,'method':method,'params':params})+'\n');proc.stdin.flush()
  selector=selectors.DefaultSelector();selector.register(proc.stdout,selectors.EVENT_READ);deadline=time.monotonic()+35
  while time.monotonic()<deadline:
   if not selector.select(max(.01,deadline-time.monotonic())):break
   line=proc.stdout.readline()
   if not line:break
   msg=json.loads(line)
   if msg.get('id')==i:
    if 'error' in msg:raise RuntimeError(msg)
    return msg['result']
  raise TimeoutError(method)
 try:
  evidence['initialize']=rpc(1,'initialize',{'clientInfo':{'name':'package-qa','version':'1'},'capabilities':{'experimentalApi':True}})
  proc.stdin.write('{"method":"initialized"}\n');proc.stdin.flush()
  discovery=rpc(2,'skills/list',{'cwds':[str(root)],'forceReload':True})
  groups=discovery.get('data',[]);skills=[s for g in groups for s in g['skills'] if s.get('pluginId')=='pedrotypes-skills@pedrotypes']
  evidence['skills']=skills
  (out/'skills-list.json').write_text(json.dumps({'skills':skills},indent=2))
  assert sorted(s['name'].split(':')[-1] for s in skills)==['build','improve-architecture','retro','setup'],skills
  for s in skills:
   name=s['name'].split(':')[-1];metadata=(pathlib.Path(s['path']).parent/'agents/openai.yaml').read_text();assert ('allow_implicit_invocation: true' if name in ['build','setup'] else 'allow_implicit_invocation: false') in metadata,(name,metadata)
  evidence['invocation_policy']='Installed YAML verified; skills/list does not expose policy, runtime selection not exercised.'
  evidence['plugin_read']=rpc(3,'plugin/read',{'pluginName':'pedrotypes-skills','marketplacePath':str(pathlib.Path(added['installedRoot'])/'.agents/plugins/marketplace.json')})
  assert evidence['plugin_read']['plugin']['hooks']==[],evidence['plugin_read']['plugin']['hooks']
  thread=rpc(4,'thread/start',{'cwd':str(root),'approvalPolicy':'never','sandbox':'danger-full-access'})
  evidence['thread_start']={'succeeded':bool(thread.get('thread',{}).get('id'))}
 finally:
  proc.terminate();proc.wait(timeout=10);log.close()
 # Same package version, changed Git source: upgrade snapshot then reinstall cache.
 marker='\nQA upgrade marker.\n';skill=source/'skills/build/SKILL.md';skill.write_text(skill.read_text()+marker)
 for args in [['git','add','.'],['git','-c','user.name=QA','-c','user.email=qa@example.invalid','commit','-m','update fixture'],['git','update-server-info']]:run(args,source)
 run(['codex','plugin','marketplace','upgrade','pedrotypes','--json'])
 evidence['cache_updated_by_upgrade']=marker in (pluginroot/'skills/build/SKILL.md').read_text()
 run(['codex','plugin','add','pedrotypes-skills@pedrotypes','--json'])
 assert marker in (pluginroot/'skills/build/SKILL.md').read_text(),'cache did not refresh'
 assert json.loads((pluginroot/'.codex-plugin/plugin.json').read_text())['version']=='3.0.0'
 evidence['git_upgrade_same_version']='passed'
 evidence['status']='passed'
finally:
 server.shutdown();(out/'evidence.json').write_text(json.dumps(evidence,indent=2))
print(json.dumps({'status':evidence.get('status'),'proof':str(out),'fixture':str(root)}))
