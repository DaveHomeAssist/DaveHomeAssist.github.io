import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Power, Home, ChevronLeft, ChevronUp, ChevronDown, ChevronRight,
  Info, RotateCcw, Asterisk, Search, Volume2, VolumeX, Volume1,
  Play, Rewind, FastForward, Settings, Wifi, WifiOff,
  Keyboard, X, Plus, Trash2, Loader2, Save, ExternalLink, Tv
} from 'lucide-react';

const DEFAULT_APPS = [
  { name: 'Netflix',  source: 'Netflix' },
  { name: 'YouTube',  source: 'YouTube' },
  { name: 'Plex',     source: 'Plex' },
  { name: 'Prime',    source: 'Prime Video' },
  { name: 'Hulu',     source: 'Hulu' },
  { name: 'Disney+',  source: 'Disney Plus' },
];

const DEFAULT_DEVICE = {
  name: 'Living Room',
  remoteEntity: 'remote.65_tcl_roku_tv',
  mediaEntity: 'media_player.65_tcl_roku_tv',
};

const DEFAULT_CONFIG = {
  haUrl: '',
  token: '',
  devices: [DEFAULT_DEVICE],
  activeDeviceIndex: 0,
  apps: DEFAULT_APPS,
};

const CONFIG_KEY = 'roku-remote-config-v1';

// Migrate legacy single-device configs to the devices[] shape
function migrateConfig(parsed) {
  if (parsed.devices && Array.isArray(parsed.devices)) return parsed;
  if (parsed.remoteEntity || parsed.mediaEntity) {
    const { remoteEntity, mediaEntity, ...rest } = parsed;
    return {
      ...rest,
      devices: [{
        name: 'TV',
        remoteEntity: remoteEntity || DEFAULT_DEVICE.remoteEntity,
        mediaEntity: mediaEntity || DEFAULT_DEVICE.mediaEntity,
      }],
      activeDeviceIndex: 0,
    };
  }
  return parsed;
}

export default function RokuRemote() {
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [status, setStatus] = useState({ state: 'unknown', app: null });
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [pressed, setPressed] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const activeDevice = config?.devices?.[config.activeDeviceIndex] || config?.devices?.[0];

  // Load config
  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(CONFIG_KEY);
        if (result && result.value) {
          const parsed = migrateConfig(JSON.parse(result.value));
          setConfig({ ...DEFAULT_CONFIG, ...parsed });
        } else {
          setConfig(DEFAULT_CONFIG);
          setShowSettings(true);
        }
      } catch {
        setConfig(DEFAULT_CONFIG);
        setShowSettings(true);
      }
      setLoadingConfig(false);
    })();
  }, []);

  // Poll status
  useEffect(() => {
    if (!config || !config.haUrl || !config.token || !activeDevice) return;
    let alive = true;
    const poll = async () => {
      try {
        const url = `${config.haUrl.replace(/\/$/, '')}/api/states/${activeDevice.mediaEntity}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${config.token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!alive) return;
        setStatus({
          state: data.state,
          app: data.attributes?.app_name || data.attributes?.source || null,
        });
        setConnected(true);
        setError(null);
      } catch (e) {
        if (!alive) return;
        setConnected(false);
        setError(e.message);
      }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => { alive = false; clearInterval(id); };
  }, [config, activeDevice?.mediaEntity]);

  const flashToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }, []);

  const callHA = useCallback(async (path, body) => {
    if (!config?.haUrl || !config?.token) {
      throw new Error('Not configured');
    }
    const url = `${config.haUrl.replace(/\/$/, '')}/api/${path}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}${text ? `: ${text.slice(0, 80)}` : ''}`);
    }
    return res.json();
  }, [config]);

  const sendCommand = async (command) => {
    if (!activeDevice) return;
    setPressed(command);
    try {
      await callHA('services/remote/send_command', {
        entity_id: activeDevice.remoteEntity,
        command,
      });
      setError(null);
    } catch (e) {
      setError(e.message);
      flashToast(`Failed: ${e.message}`);
    }
    setTimeout(() => setPressed(null), 120);
  };

  const launchApp = async (source) => {
    if (!activeDevice) return;
    setPressed(`app-${source}`);
    try {
      await callHA('services/media_player/select_source', {
        entity_id: activeDevice.mediaEntity,
        source,
      });
      flashToast(`Launching ${source}`);
      setError(null);
    } catch (e) {
      setError(e.message);
      flashToast(`Failed: ${e.message}`);
    }
    setTimeout(() => setPressed(null), 200);
  };

  const runSearch = async (keyword) => {
    if (!keyword.trim() || !activeDevice) return;
    try {
      await callHA('services/roku/search', {
        entity_id: activeDevice.mediaEntity,
        keyword: keyword.trim(),
      });
      flashToast(`Searching: ${keyword}`);
      setShowSearch(false);
      setError(null);
    } catch (e) {
      setError(e.message);
      flashToast(`Failed: ${e.message}`);
    }
  };

  // Roku's Lit_ protocol is one character per command — loop and pace.
  const typeText = async (text) => {
    if (!text || !activeDevice) return;
    try {
      for (const char of text) {
        await callHA('services/remote/send_command', {
          entity_id: activeDevice.remoteEntity,
          command: `Lit_${char}`,
        });
        await new Promise((r) => setTimeout(r, 40));
      }
      flashToast(`Typed: ${text}`);
      setShowKeyboard(false);
      setError(null);
    } catch (e) {
      setError(e.message);
      flashToast(`Failed: ${e.message}`);
    }
  };

  const saveConfig = async (next) => {
    setConfig(next);
    try {
      await window.storage.set(CONFIG_KEY, JSON.stringify(next));
      flashToast('Settings saved');
    } catch (e) {
      flashToast(`Save failed: ${e.message}`);
    }
  };

  const switchDevice = (i) => {
    if (!config || i === config.activeDeviceIndex) return;
    const next = { ...config, activeDeviceIndex: i };
    setConfig(next);
    setStatus({ state: 'unknown', app: null });
    setConnected(false);
    window.storage.set(CONFIG_KEY, JSON.stringify(next)).catch(() => {});
    flashToast(`Switched to ${config.devices[i].name}`);
  };

  if (loadingConfig) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  const devices = config.devices || [];
  const multiDevice = devices.length > 1;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-start justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2 min-w-0">
            {connected ? (
              <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <div className="text-xs min-w-0">
              <div className="font-medium text-zinc-200 truncate">
                {connected ? (status.app || 'Idle') : 'Disconnected'}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                {connected ? status.state : (config.haUrl ? 'Check HA / token' : 'Not configured')}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 active:scale-95 transition shrink-0"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Device switcher */}
        {multiDevice && (
          <div className="mb-3 flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
            {devices.map((d, i) => (
              <button
                key={i}
                onClick={() => switchDevice(i)}
                className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition ${
                  i === config.activeDeviceIndex
                    ? 'bg-purple-700 text-white'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Tv className="w-3 h-3" />
                {d.name || `TV ${i + 1}`}
              </button>
            ))}
          </div>
        )}

        {/* Remote body */}
        <div className="bg-zinc-900 rounded-3xl p-5 shadow-2xl border border-zinc-800">
          {/* Power + app shortcuts header */}
          <div className="flex items-center justify-between mb-4">
            <RemoteBtn
              onClick={() => sendCommand('power')}
              pressed={pressed === 'power'}
              className="bg-red-600 hover:bg-red-500 text-white w-11 h-11 rounded-full"
              aria-label="Power"
            >
              <Power className="w-5 h-5" strokeWidth={2.5} />
            </RemoteBtn>
            <div className="flex gap-1.5">
              <RemoteBtn
                onClick={() => sendCommand('back')}
                pressed={pressed === 'back'}
                className="bg-zinc-800 hover:bg-zinc-700 px-3 h-9 rounded-lg text-xs font-medium"
                aria-label="Back"
              >
                Back
              </RemoteBtn>
              <RemoteBtn
                onClick={() => sendCommand('home')}
                pressed={pressed === 'home'}
                className="bg-zinc-800 hover:bg-zinc-700 w-9 h-9 rounded-lg"
                aria-label="Home"
              >
                <Home className="w-4 h-4" />
              </RemoteBtn>
            </div>
          </div>

          {/* App shortcuts */}
          {config.apps?.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5 mb-5">
              {config.apps.slice(0, 6).map((app) => (
                <RemoteBtn
                  key={app.source}
                  onClick={() => launchApp(app.source)}
                  pressed={pressed === `app-${app.source}`}
                  className="bg-zinc-800 hover:bg-zinc-700 h-10 rounded-lg text-xs font-medium truncate px-2"
                >
                  {app.name}
                </RemoteBtn>
              ))}
            </div>
          )}

          {/* D-pad */}
          <div className="relative w-56 h-56 mx-auto my-2">
            <div className="absolute inset-0 rounded-full bg-zinc-950 border border-zinc-800" />
            <RemoteBtn
              onClick={() => sendCommand('up')}
              pressed={pressed === 'up'}
              className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full hover:bg-zinc-800/60"
              aria-label="Up"
            >
              <ChevronUp className="w-7 h-7" />
            </RemoteBtn>
            <RemoteBtn
              onClick={() => sendCommand('down')}
              pressed={pressed === 'down'}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full hover:bg-zinc-800/60"
              aria-label="Down"
            >
              <ChevronDown className="w-7 h-7" />
            </RemoteBtn>
            <RemoteBtn
              onClick={() => sendCommand('left')}
              pressed={pressed === 'left'}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full hover:bg-zinc-800/60"
              aria-label="Left"
            >
              <ChevronLeft className="w-7 h-7" />
            </RemoteBtn>
            <RemoteBtn
              onClick={() => sendCommand('right')}
              pressed={pressed === 'right'}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full hover:bg-zinc-800/60"
              aria-label="Right"
            >
              <ChevronRight className="w-7 h-7" />
            </RemoteBtn>
            <RemoteBtn
              onClick={() => sendCommand('select')}
              pressed={pressed === 'select'}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-purple-700 hover:bg-purple-600 text-white font-semibold text-sm shadow-lg shadow-purple-900/40"
              aria-label="OK"
            >
              OK
            </RemoteBtn>
          </div>

          {/* Utility row: replay, info (*), keyboard */}
          <div className="grid grid-cols-3 gap-1.5 mt-3 mb-3">
            <RemoteBtn
              onClick={() => sendCommand('replay')}
              pressed={pressed === 'replay'}
              className="bg-zinc-800 hover:bg-zinc-700 h-10 rounded-lg"
              aria-label="Instant replay"
            >
              <RotateCcw className="w-4 h-4 mx-auto" />
            </RemoteBtn>
            <RemoteBtn
              onClick={() => sendCommand('info')}
              pressed={pressed === 'info'}
              className="bg-zinc-800 hover:bg-zinc-700 h-10 rounded-lg"
              aria-label="Options (*)"
            >
              <Asterisk className="w-4 h-4 mx-auto" />
            </RemoteBtn>
            <RemoteBtn
              onClick={() => setShowKeyboard(true)}
              className="bg-zinc-800 hover:bg-zinc-700 h-10 rounded-lg"
              aria-label="Keyboard"
            >
              <Keyboard className="w-4 h-4 mx-auto" />
            </RemoteBtn>
          </div>

          {/* Transport row */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            <RemoteBtn
              onClick={() => sendCommand('reverse')}
              pressed={pressed === 'reverse'}
              className="bg-zinc-800 hover:bg-zinc-700 h-11 rounded-lg"
              aria-label="Rewind"
            >
              <Rewind className="w-5 h-5 mx-auto" />
            </RemoteBtn>
            <RemoteBtn
              onClick={() => sendCommand('play')}
              pressed={pressed === 'play'}
              className="bg-zinc-800 hover:bg-zinc-700 h-11 rounded-lg"
              aria-label="Play / Pause"
            >
              <Play className="w-5 h-5 mx-auto" />
            </RemoteBtn>
            <RemoteBtn
              onClick={() => sendCommand('forward')}
              pressed={pressed === 'forward'}
              className="bg-zinc-800 hover:bg-zinc-700 h-11 rounded-lg"
              aria-label="Fast forward"
            >
              <FastForward className="w-5 h-5 mx-auto" />
            </RemoteBtn>
          </div>

          {/* Volume row */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            <RemoteBtn
              onClick={() => sendCommand('volume_down')}
              pressed={pressed === 'volume_down'}
              className="bg-zinc-800 hover:bg-zinc-700 h-11 rounded-lg"
              aria-label="Volume down"
            >
              <Volume1 className="w-5 h-5 mx-auto" />
            </RemoteBtn>
            <RemoteBtn
              onClick={() => sendCommand('volume_mute')}
              pressed={pressed === 'volume_mute'}
              className="bg-zinc-800 hover:bg-zinc-700 h-11 rounded-lg"
              aria-label="Mute"
            >
              <VolumeX className="w-5 h-5 mx-auto" />
            </RemoteBtn>
            <RemoteBtn
              onClick={() => sendCommand('volume_up')}
              pressed={pressed === 'volume_up'}
              className="bg-zinc-800 hover:bg-zinc-700 h-11 rounded-lg"
              aria-label="Volume up"
            >
              <Volume2 className="w-5 h-5 mx-auto" />
            </RemoteBtn>
          </div>

          {/* Search */}
          <RemoteBtn
            onClick={() => setShowSearch(true)}
            className="w-full bg-zinc-800 hover:bg-zinc-700 h-10 rounded-lg flex items-center justify-center gap-2 text-sm"
          >
            <Search className="w-4 h-4" />
            Search
          </RemoteBtn>
        </div>

        {/* Entity footer */}
        <div className="mt-3 text-[10px] text-zinc-600 text-center font-mono truncate">
          {activeDevice?.remoteEntity || 'No device'}
        </div>

        {error && !connected && (
          <div className="mt-3 p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-xs text-red-300">
            {error}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm shadow-xl z-50">
          {toast}
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <SettingsModal
          config={config}
          onSave={async (next) => { await saveConfig(next); setShowSettings(false); }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Search modal */}
      {showSearch && (
        <InputModal
          title="Search"
          placeholder="e.g. Space Jam"
          submitLabel="Search"
          onSubmit={runSearch}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* Keyboard modal */}
      {showKeyboard && (
        <InputModal
          title="Type text"
          placeholder="Typed one character at a time"
          submitLabel="Send"
          onSubmit={typeText}
          onClose={() => setShowKeyboard(false)}
        />
      )}
    </div>
  );
}

function RemoteBtn({ children, onClick, pressed, className = '', ...rest }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center transition active:scale-95 ${pressed ? 'ring-2 ring-purple-500 scale-95' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

function InputModal({ title, placeholder, submitLabel, onSubmit, onClose }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-40"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">{title}</div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
            <X className="w-4 h-4" />
          </button>
        </div>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(value); }}
          placeholder={placeholder}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-purple-600"
        />
        <button
          onClick={() => onSubmit(value)}
          className="w-full bg-purple-700 hover:bg-purple-600 rounded-lg h-10 text-sm font-medium"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

function SettingsModal({ config, onSave, onClose }) {
  const [draft, setDraft] = useState(config);
  const [testing, setTesting] = useState(null); // index of device being tested
  const [testResult, setTestResult] = useState(null);

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const updateApp = (i, patch) => {
    const apps = [...draft.apps];
    apps[i] = { ...apps[i], ...patch };
    update({ apps });
  };

  const addApp = () => update({ apps: [...draft.apps, { name: '', source: '' }] });

  const removeApp = (i) => {
    const apps = draft.apps.filter((_, idx) => idx !== i);
    update({ apps });
  };

  const updateDevice = (i, patch) => {
    const devices = [...draft.devices];
    devices[i] = { ...devices[i], ...patch };
    update({ devices });
  };

  const addDevice = () => update({
    devices: [...draft.devices, { name: `TV ${draft.devices.length + 1}`, remoteEntity: '', mediaEntity: '' }],
  });

  const removeDevice = (i) => {
    if (draft.devices.length <= 1) return;
    const devices = draft.devices.filter((_, idx) => idx !== i);
    let activeDeviceIndex = draft.activeDeviceIndex;
    if (activeDeviceIndex >= devices.length) activeDeviceIndex = devices.length - 1;
    else if (i < activeDeviceIndex) activeDeviceIndex -= 1;
    update({ devices, activeDeviceIndex });
  };

  const testConnection = async (i) => {
    const device = draft.devices[i];
    setTesting(i);
    setTestResult(null);
    try {
      const url = `${draft.haUrl.replace(/\/$/, '')}/api/states/${device.mediaEntity}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${draft.token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTestResult({ ok: true, msg: `${device.name}: ${data.state}`, i });
    } catch (e) {
      setTestResult({ ok: false, msg: `${device.name}: ${e.message}`, i });
    }
    setTesting(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-start justify-center p-4 z-40 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 w-full max-w-md my-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold">Settings</div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <Field label="Home Assistant URL" hint="e.g. https://ha.yourdomain.com">
            <input
              value={draft.haUrl}
              onChange={(e) => update({ haUrl: e.target.value })}
              placeholder="https://homeassistant.local:8123"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-600 font-mono text-xs"
            />
          </Field>

          <Field label="Long-Lived Access Token" hint="Profile → Security → Create Token">
            <input
              type="password"
              value={draft.token}
              onChange={(e) => update({ token: e.target.value })}
              placeholder="eyJ0eXAi..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-600 font-mono text-xs"
            />
          </Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-zinc-400">Devices</div>
              <button
                onClick={addDevice}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add TV
              </button>
            </div>
            <div className="space-y-2">
              {draft.devices.map((device, i) => (
                <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      value={device.name}
                      onChange={(e) => updateDevice(i, { name: e.target.value })}
                      placeholder="Nickname (e.g. Living Room)"
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-purple-600"
                    />
                    {draft.devices.length > 1 && (
                      <button
                        onClick={() => removeDevice(i)}
                        className="px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded hover:bg-red-950/40 hover:border-red-900"
                        aria-label="Remove device"
                      >
                        <Trash2 className="w-3 h-3 text-zinc-500" />
                      </button>
                    )}
                  </div>
                  <input
                    value={device.remoteEntity}
                    onChange={(e) => updateDevice(i, { remoteEntity: e.target.value })}
                    placeholder="remote.living_room_roku_tv"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-purple-600 font-mono"
                  />
                  <input
                    value={device.mediaEntity}
                    onChange={(e) => updateDevice(i, { mediaEntity: e.target.value })}
                    placeholder="media_player.living_room_roku_tv"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-purple-600 font-mono"
                  />
                  <button
                    onClick={() => testConnection(i)}
                    disabled={testing !== null || !draft.haUrl || !draft.token || !device.mediaEntity}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 rounded h-7 text-[11px] flex items-center justify-center gap-1.5"
                  >
                    {testing === i ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                    Test
                  </button>
                  {testResult && testResult.i === i && (
                    <div className={`text-[11px] p-1.5 rounded ${testResult.ok ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-900/60' : 'bg-red-950/40 text-red-300 border border-red-900/60'}`}>
                      {testResult.msg}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-[10px] text-zinc-500 mt-2">
              Entity IDs come from Home Assistant — each Roku integration creates a <code>remote.*</code> and <code>media_player.*</code> pair. HA handles the IP mapping.
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-zinc-400">App shortcuts</div>
              <button
                onClick={addApp}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="space-y-1.5">
              {draft.apps.map((app, i) => (
                <div key={i} className="flex gap-1.5">
                  <input
                    value={app.name}
                    onChange={(e) => updateApp(i, { name: e.target.value })}
                    placeholder="Label"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-purple-600"
                  />
                  <input
                    value={app.source}
                    onChange={(e) => updateApp(i, { source: e.target.value })}
                    placeholder="HA source (exact)"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-purple-600"
                  />
                  <button
                    onClick={() => removeApp(i)}
                    className="px-2 bg-zinc-950 border border-zinc-800 rounded-lg hover:bg-red-950/40 hover:border-red-900"
                  >
                    <Trash2 className="w-3 h-3 text-zinc-500" />
                  </button>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-zinc-500 mt-2">
              Source must match the Roku app name exactly (or use the numeric app ID).
            </div>
          </div>

          <button
            onClick={() => onSave(draft)}
            className="w-full bg-purple-700 hover:bg-purple-600 rounded-lg h-10 text-sm font-medium flex items-center justify-center gap-2 mt-4"
          >
            <Save className="w-4 h-4" />
            Save
          </button>

          <details className="text-[11px] text-zinc-500 mt-2">
            <summary className="cursor-pointer hover:text-zinc-400">Setup notes</summary>
            <div className="mt-2 space-y-1.5 pl-2 border-l border-zinc-800">
              <div>1. Add to <code className="text-zinc-400">configuration.yaml</code>:</div>
              <pre className="bg-zinc-950 p-2 rounded text-[10px] overflow-x-auto">{`http:
  cors_allowed_origins:
    - https://claude.ai`}</pre>
              <div>2. Restart Home Assistant.</div>
              <div>3. HA must be reachable over HTTPS (mixed content is blocked on claude.ai).</div>
              <div>4. Token lives in browser storage (window.storage) — treat accordingly.</div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1">{label}</label>
      {children}
      {hint && <div className="text-[10px] text-zinc-500 mt-1">{hint}</div>}
    </div>
  );
}
