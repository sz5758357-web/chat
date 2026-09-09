const {
    app,
    BrowserWindow,
    WebContentsView,
    ipcMain,
    session,
    shell
} = require("electron");

const path = require("path");

let win;
let tabs = [];
let activeTabId = null;
let nextTabId = 1;

const HOME_URL = "https://www.google.com";

function createWindow() {
    win = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 900,
        minHeight: 600,
        backgroundColor: "#202124",
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });

    win.loadFile(path.join(__dirname, "src", "index.html"));

    win.on("resize", resizeActiveTab);

    createTab(HOME_URL);
}

function createTab(url = HOME_URL) {
    const id = nextTabId++;

    const view = new WebContentsView({
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    view.setBackgroundColor("#ffffff");

    const tab = {
        id,
        view,
        url,
        title: "Nowa karta"
    };

    tabs.push(tab);

    setupTabEvents(tab);

    if (win) {
        win.contentView.addChildView(view);
        activeTabId = id;
        resizeActiveTab();

        view.webContents.loadURL(url);
    }

    sendTabs();

    return id;
}

function setupTabEvents(tab) {
    const wc = tab.view.webContents;

    wc.on("page-title-updated", (event, title) => {
        event.preventDefault();

        tab.title = title || "Nowa karta";

        sendTabs();
    });

    wc.on("did-navigate", (event, url) => {
        tab.url = url;

        sendTabState(tab);
    });

    wc.on("did-navigate-in-page", (event, url) => {
        tab.url = url;

        sendTabState(tab);
    });

    wc.on("did-start-loading", () => {
        sendTabState(tab, true);
    });

    wc.on("did-stop-loading", () => {
        sendTabState(tab, false);
    });

    wc.setWindowOpenHandler(({ url }) => {
        createTab(url);

        return {
            action: "deny"
        };
    });

    wc.on("will-download", (event, item) => {
        const downloadsPath = app.getPath("downloads");

        item.setSavePath(
            path.join(downloadsPath, item.getFilename())
        );
    });
}

function getActiveTab() {
    return tabs.find(tab => tab.id === activeTabId);
}

function resizeActiveTab() {
    if (!win) return;

    const tab = getActiveTab();

    if (!tab) return;

    const bounds = win.getContentBounds();

    tab.view.setBounds({
        x: 0,
        y: 76,
        width: bounds.width,
        height: Math.max(0, bounds.height - 76)
    });
}

function activateTab(id) {
    const tab = tabs.find(t => t.id === id);

    if (!tab) return;

    const current = getActiveTab();

    if (current && current.id !== id) {
        try {
            win.contentView.removeChildView(current.view);
        } catch {}
    }

    activeTabId = id;

    win.contentView.addChildView(tab.view);

    resizeActiveTab();

    sendTabs();
    sendTabState(tab);
}

function closeTab(id) {
    const index = tabs.findIndex(t => t.id === id);

    if (index === -1) return;

    const tab = tabs[index];

    try {
        win.contentView.removeChildView(tab.view);
    } catch {}

    try {
        tab.view.webContents.close();
    } catch {}

    tabs.splice(index, 1);

    if (tabs.length === 0) {
        createTab(HOME_URL);
        return;
    }

    if (activeTabId === id) {
        const newIndex = Math.max(0, index - 1);
        activeTabId = tabs[newIndex].id;

        win.contentView.addChildView(tabs[newIndex].view);

        resizeActiveTab();

        sendTabState(tabs[newIndex]);
    }

    sendTabs();
}

function sendTabs() {
    if (!win || win.isDestroyed()) return;

    win.webContents.send(
        "tabs-updated",
        tabs.map(tab => ({
            id: tab.id,
            title: tab.title,
            url: tab.url,
            active: tab.id === activeTabId
        }))
    );
}

function sendTabState(tab, loading = false) {
    if (!win || win.isDestroyed()) return;

    win.webContents.send("tab-state", {
        id: tab.id,
        url: tab.url,
        title: tab.title,
        loading,
        canGoBack: tab.view.webContents.canGoBack(),
        canGoForward: tab.view.webContents.canGoForward()
    });
}

function navigate(id, url) {
    const tab = tabs.find(t => t.id === id);

    if (!tab) return;

    tab.url = url;

    tab.view.webContents.loadURL(url);

    sendTabState(tab, true);
}

function normalizeURL(input) {
    input = input.trim();

    if (!input) {
        return HOME_URL;
    }

    if (/^https?:\/\//i.test(input)) {
        return input;
    }

    if (
        input.includes(".") &&
        !input.includes(" ")
    ) {
        return "https://" + input;
    }

    return "https://www.google.com/search?q=" +
        encodeURIComponent(input);
}

app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler(
        (webContents, permission, callback) => {
            const allowed = [
                "fullscreen",
                "clipboard-read",
                "clipboard-sanitized-write"
            ];

            callback(allowed.includes(permission));
        }
    );

    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

ipcMain.handle("new-tab", () => {
    return createTab(HOME_URL);
});

ipcMain.handle("close-tab", (event, id) => {
    closeTab(id);
});

ipcMain.handle("switch-tab", (event, id) => {
    activateTab(id);
});

ipcMain.handle("navigate", (event, id, input) => {
    const url = normalizeURL(input);

    navigate(id, url);
});

ipcMain.handle("back", () => {
    const tab = getActiveTab();

    if (tab && tab.view.webContents.canGoBack()) {
        tab.view.webContents.goBack();
    }
});

ipcMain.handle("forward", () => {
    const tab = getActiveTab();

    if (tab && tab.view.webContents.canGoForward()) {
        tab.view.webContents.goForward();
    }
});

ipcMain.handle("reload", () => {
    const tab = getActiveTab();

    if (tab) {
        tab.view.webContents.reload();
    }
});

ipcMain.handle("home", () => {
    const tab = getActiveTab();

    if (tab) {
        navigate(tab.id, HOME_URL);
    }
});

ipcMain.handle("open-external", (event, url) => {
    shell.openExternal(url);
});
