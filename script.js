const frame = document.getElementById("browserFrame");
const address = document.getElementById("address");

const back = document.getElementById("back");
const forward = document.getElementById("forward");
const reload = document.getElementById("reload");
const home = document.getElementById("home");
const go = document.getElementById("go");

const statusText = document.getElementById("statusText");
const errorBox = document.getElementById("error");

const HOME_PAGE = "https://example.com";

let history = [];
let historyIndex = -1;

function normalizeUrl(input) {
    input = input.trim();

    if (!input) {
        return HOME_PAGE;
    }

    // Jeśli użytkownik wpisał adres bez https://
    if (
        input.startsWith("http://") ||
        input.startsWith("https://")
    ) {
        return input;
    }

    // Jeśli wygląda jak adres strony
    if (input.includes(".") && !input.includes(" ")) {
        return "https://" + input;
    }

    // W przeciwnym razie wyszukaj w Google
    return "https://www.google.com/search?q=" +
        encodeURIComponent(input);
}

function navigate(url, saveHistory = true) {
    const finalUrl = normalizeUrl(url);

    errorBox.classList.remove("active");

    frame.src = finalUrl;
    address.value = finalUrl;

    statusText.textContent = "Ładowanie...";

    if (saveHistory) {
        history = history.slice(0, historyIndex + 1);
        history.push(finalUrl);
        historyIndex++;

        updateButtons();
    }
}

function updateButtons() {
    back.disabled = historyIndex <= 0;
    forward.disabled = historyIndex >= history.length - 1;

    back.style.opacity = back.disabled ? "0.35" : "1";
    forward.style.opacity = forward.disabled ? "0.35" : "1";
}

function goBack() {
    if (historyIndex <= 0) return;

    historyIndex--;

    const url = history[historyIndex];

    frame.src = url;
    address.value = url;

    updateButtons();
}

function goForward() {
    if (historyIndex >= history.length - 1) return;

    historyIndex++;

    const url = history[historyIndex];

    frame.src = url;
    address.value = url;

    updateButtons();
}

function reloadPage() {
    frame.src = frame.src;
    statusText.textContent = "Odświeżanie...";
}

function goHome() {
    navigate(HOME_PAGE);
}

go.addEventListener("click", () => {
    navigate(address.value);
});

address.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        navigate(address.value);
    }
});

back.addEventListener("click", goBack);
forward.addEventListener("click", goForward);
reload.addEventListener("click", reloadPage);
home.addEventListener("click", goHome);

frame.addEventListener("load", () => {
    statusText.textContent = "Gotowe";

    /*
       Nie możemy zawsze odczytać adresu iframe,
       ponieważ przeglądarka blokuje dostęp do
       zawartości innych domen przez Same-Origin Policy.
    */
});

frame.addEventListener("error", () => {
    statusText.textContent = "Błąd ładowania";
    errorBox.classList.add("active");
});

// Start
history.push(HOME_PAGE);
historyIndex = 0;
updateButtons();
