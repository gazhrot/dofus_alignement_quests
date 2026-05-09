let currentRawData = [];
let currentNoCumulateList = [];

async function loadAlignmentData(alignment) {
    try {
        const response = await fetch(`${alignment}.json`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        currentRawData = data.rawData;
        currentNoCumulateList = data.noCumulateList;
        
        filterResources();
        document.getElementById("error-message").style.display = "none";
    } catch (error) {
        console.error("Erreur:", error);
        document.getElementById("error-message").textContent = `Fichier ${alignment}.json introuvable. Testez sur GitHub Pages !`;
        document.getElementById("error-message").style.display = "block";
        document.querySelectorAll("ul").forEach(ul => ul.innerHTML = "");
    }
}

document.querySelectorAll('input[name="alignment"]').forEach(radio => {
    radio.addEventListener('change', (e) => loadAlignmentData(e.target.value));
});

function filterResources() {
    if (currentRawData.length === 0) return;

    const startQuest = parseInt(document.getElementById("startQt").value, 10);
    const endQuest = parseInt(document.getElementById("endQt").value, 10);
    let charCount = parseInt(document.getElementById("charCount").value, 10);
    const errorMessage = document.getElementById("error-message");

    if (isNaN(startQuest) || isNaN(endQuest) || isNaN(charCount) || startQuest < 1 || endQuest < 1 || charCount < 1 || startQuest > 100 || endQuest > 100 || startQuest > endQuest) {
        errorMessage.textContent = "Valeurs invalides.";
        errorMessage.style.display = "block";
        return;
    }
    errorMessage.style.display = "none";

    const filteredAlgQt = currentRawData.filter(item => item.quest >= startQuest && item.quest <= endQuest);
    const groupedQuantity = {};

    filteredAlgQt.forEach(item => {
        let normalizedName = item.name;
        if (normalizedName.toLowerCase().startsWith("combats")) {
            normalizedName = "combat" + normalizedName.slice(7);
        }

        const key = `${item.type}|${normalizedName}`;
        if (!groupedQuantity[key]) {
            groupedQuantity[key] = { name: normalizedName, quantity: item.quantity, type: item.type };
        } else {
            if (!currentNoCumulateList.includes(normalizedName)) {
                groupedQuantity[key].quantity += item.quantity;
            }
        }
    });

    const sortedGrouped = Object.values(groupedQuantity).sort((a, b) => b.quantity - a.quantity);
    
    const lists = {
        resources: document.getElementById("filteredResources"),
        dungeons: document.getElementById("filteredDungeons"),
        combats: document.getElementById("filteredCombats"),
        others: document.getElementById("filteredOthers"),
    };

    for (const key in lists) {
        lists[key].innerHTML = "";
        if (!sortedGrouped.some(item => item.type === key)) {
            const li = document.createElement("li");
            li.textContent = "Rien à prévoir.";
            li.style.listStyle = "none";
            lists[key].appendChild(li);
        }
    }

    sortedGrouped.forEach(item => {
        let displayName = item.name;
        
        if (displayName.toLowerCase().startsWith("combat")) {
            const match = displayName.match(/^combat(s)?(\b.*)/i);
            if (match) displayName = (item.quantity > 1 ? "combats" : "combat") + (match[2] || "");
        }

        let finalQuantity = item.quantity;
        let detailPerso = "";

        if (item.type === "resources" || displayName.toLowerCase().includes("kamas")) {
            finalQuantity = item.quantity * charCount;
            
            if (charCount > 1) {
                displayName = displayName.replace(/\.$/, ''); 
                detailPerso = ` (${item.quantity}/perso)`;
            }
        }

        const li = document.createElement("li");
        li.textContent = `${finalQuantity} x ${displayName}${detailPerso}`;
        li.classList.add("clickable-item");
        li.title = "Cliquez pour copier";
        
        li.onclick = () => copyToClipboard(item.name);

        lists[item.type].appendChild(li);
    });
}

function resetResources() {
    document.getElementById("startQt").value = 1;
    document.getElementById("endQt").value = 10;
    document.getElementById("charCount").value = 1;
    filterResources();
}

function copyToClipboard(text) {
    const cleanText = text.replace(/\.$/, '').trim();
    navigator.clipboard.writeText(cleanText).then(() => {
        showToast(`"${cleanText}" copié !`);
    });
}

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
}

document.addEventListener("DOMContentLoaded", () => loadAlignmentData('brakmar'));