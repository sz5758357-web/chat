const {
    contextBridge,
    ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld("browserAPI", {

    newTab: () => {
        return ipcRenderer.invoke("new-tab");
    },

    closeTab: (id) => {
        return ipcRenderer.invoke("close-tab", id);
    },

    switchTab: (id) => {
        return ipcRenderer.invoke("switch-tab", id);
    },

    navigate: (id, url) => {
        return ipcRenderer.invoke("navigate", id, url);
    },

    back: () => {
        return ipcRenderer.invoke("back");
    },

    forward: () => {
        return ipcRenderer.invoke("forward");
    },

    reload: () => {
        return ipcRenderer.invoke("reload");
    },

    home: () => {
        return ipcRenderer.invoke("home");
    },

    openExternal: (url) => {
        return ipcRenderer.invoke("open-external", url);
    },

    onTabsUpdated: (callback) => {
        ipcRenderer.on("tabs-updated", (event, tabs) => {
            callback(tabs);
        });
    },

    onTabState: (callback) => {
        ipcRenderer.on("tab-state", (event, state) => {
            callback(state);
        });
    }
});
