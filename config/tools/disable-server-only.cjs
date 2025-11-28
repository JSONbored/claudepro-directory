const Module = require('module');

const originalLoad = Module._load;

Module._load = function patchedLoad(request, _parent, _isMain) {
  if (request.includes('server-only')) {
    return {};
  }
  // biome-ignore lint/complexity/noArguments: arguments is required for monkey-patching Node.js internals safely
  return originalLoad.apply(this, arguments);
};
