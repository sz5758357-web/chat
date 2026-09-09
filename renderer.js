const tabsContainer =
    document.getElementById("tabs");

const address =
    document.getElementById("address");

const back =
    document.getElementById("back");

const forward =
    document.getElementById("forward");

const reload =
    document.getElementById("reload");

const home =
    document.getElementById("home");

const go =
    document.getElementById("go");

const newTab =
    document.getElementById("newTab");

const loadingBar =
    document.getElementById("loadingBar");

let tabs = [];
let activeTab = null;

function renderTabs() {

    tabsContainer.innerHTML = "";

    tabs.forEach(tab => {

        const element =
            document.createElement("div");

        element.className =
            "tab" +
            (tab.active ? " active" : "");

        element.dataset.id =
            tab.id;

        const title =
            document.createElement("div");

        title.className =
            "tab-title";

        title.textContent =
            tab.title || "Nowa karta";

        const close =
            document.createElement("button");

        close.className =
            "close-tab";

        close.textContent =
            "×";

        close.title =
            "Zamknij kartę";

        close.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                window.browserAPI.closeTab(
                    tab.id
                );
            }
        );

        element.appendChild(title);
        element.appendChild(close);

        element.addEventListener(
            "click",
            () => {

                window.browserAPI.switchTab(
                    tab.id
                );
            }
        );

        tabsContainer.appendChild(element);
    });
}

function updateNavigation(state) {

    if (!state) return;

    if (state.id === activeTab) {

        address.value =
            state.url || "";

        back.disabled =
            !state.canGoBack;

        forward.disabled =
            !state.canGoForward;

        back.style.opacity =
            state.canGoBack
                ? "1"
                : "0.35";

        forward.style.opacity =
            state.canGoForward
                ? "1"
                : "0.35";
    }

    if (state.loading) {

        loadingBar.style.width =
            "70%";

    } else {

        loadingBar.style.width =
            "100%";

        setTimeout(() => {

            loadingBar.style.width =
                "0";

        }, 200);
    }
}

function navigate() {

    if (!activeTab) return;

    const value =
        address.value.trim();

    if (!value) return;

    window.browserAPI.navigate(
        activeTab,
        value
    );
}

address.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            navigate();
        }
    }
);

go.addEventListener(
    "click",
    navigate
);

back.addEventListener(
    "click",
    () => {
        window.browserAPI.back();
    }
);

forward.addEventListener(
    "click",
    () => {
        window.browserAPI.forward();
    }
);

reload.addEventListener(
    "click",
    () => {
        window.browserAPI.reload();
    }
);

home.addEventListener(
    "click",
    () => {
        window.browserAPI.home();
    }
);

newTab.addEventListener(
    "click",
    () => {
        window.browserAPI.newTab();
    }
);

window.browserAPI.onTabsUpdated(
    updatedTabs => {

        tabs = updatedTabs;

        const current =
            tabs.find(tab => tab.active);

        if (current) {
            activeTab = current.id;
        }

        renderTabs();

        if (current) {
            address.value =
                current.url || "";
        }
    }
);

window.browserAPI.onTabState(
    state => {
        updateNavigation(state);

        if (state.id === activeTab) {
            address.value =
                state.url || "";
        }

        const tab =
            tabs.find(t => t.id === state.id);

        if (tab) {

            tab.url =
                state.url;

            if (state.title) {
                tab.title =
                    state.title;
            }

            renderTabs();
        }
    }
);

document.addEventListener(
    "keydown",
    event => {

        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "l"
        ) {

            event.preventDefault();

            address.focus();
            address.select();
        }

        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "t"
        ) {

            event.preventDefault();

            window.browserAPI.newTab();
        }

        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "w"
        ) {

            event.preventDefault();

            if (activeTab) {
                window.browserAPI.closeTab(
                    activeTab
                );
            }
        }

        if (
            event.altKey &&
            event.key === "ArrowLeft"
        ) {

            event.preventDefault();

            window.browserAPI.back();
        }

        if (
            event.altKey &&
            event.key === "ArrowRight"
        ) {

            event.preventDefault();

            window.browserAPI.forward();
        }

        if (
            event.key === "F5"
        ) {

            event.preventDefault();

            window.browserAPI.reload();
        }
    }
);
