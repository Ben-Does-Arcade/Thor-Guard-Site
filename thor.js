let config = null;
let lastActions = {};

function speak(msg) {
    if (config.settings.voiceAnnouncements) {
        console.log("Speaking: " + msg);
        let tts = new SpeechSynthesisUtterance(msg);
        speechSynthesis.speak(tts);
    }
}

function build() {
    let request = new XMLHttpRequest();
    request.open("GET", "./config.json");
    request.send(null);

    request.addEventListener("load", function() {
        config = JSON.parse(request.responseText);
        let tableData = document.querySelector(".thor-table");

        for (let thor = 0; thor < config.thorGuards.length; thor++) {
            let newNode = tableData.cloneNode(true);
            tableData.parentElement.appendChild(newNode);
            newNode.removeAttribute("style");
            newNode.querySelector(".thor-name").textContent = config.thorGuards[thor].name;

            let properties = newNode.querySelectorAll(".thor-property");
            let propertyValues = newNode.querySelectorAll(".thor-property-value");
            let refreshButton = newNode.querySelector(".button-refresh");
            let thorButton = newNode.querySelector(".button-xml");

            for (let i = 0; i < properties.length; i++) {
                properties[i].textContent = properties[i].getAttribute("data-property").toUpperCase();
                propertyValues[i].textContent = "-";
            }

            thorButton.addEventListener("click", function() {
                window.open(config.thorGuards[thor].mobile);
            });

            refreshButton.addEventListener("click", function() {
                console.log("Refreshing table " + thor);

                refresh(thor, thor + 1);
            });
        }

        document.querySelector(".thor-table").remove();

        console.log("Build complete");

        alert("Click screen anywhere for voice to work");

        setTimeout(function() {
            setInterval(function() {
                refresh(0, config.thorGuards.length);
            }, config.settings.refreshDelay);
        }, 3000);
    });
}

function refresh(startRange, endRange) {
    for (let thor = startRange; thor < endRange; thor++) {
        let request = new XMLHttpRequest();
        let thisData = document.querySelectorAll(".thor-table")[thor];
        let properties = thisData.querySelectorAll(".thor-property");
        let propertyValues = thisData.querySelectorAll(".thor-property-value");

        /*for (let i = 0; i < properties.length; i++) {
            propertyValues[i].textContent = "-";
        }*/

        request.addEventListener("load", function() {
            let xml = this.responseXML;

            for (let i = 0; i < properties.length; i++) {
                propertyValues[i].textContent = xml.querySelector(properties[i].getAttribute("data-property")).textContent;
            }

            let status = thisData.querySelector(".thor-status");
            let thorName = thisData.querySelector(".thor-name");
            let energyBarPos = thisData.querySelector(".thor-energy-bar-filled-positive");
            let energyBarNeg = thisData.querySelector(".thor-energy-bar-filled-negative");
            /*let warning = document.querySelector("#sound-warning");
            let redAlert = document.querySelector("#sound-red-alert");*/
            let lightning = xml.querySelector("lightningalert").textContent
            let energy = parseInt(xml.querySelector("energylevel").textContent);
            let energyPolarity = xml.querySelector("energypolarity").textContent;
            let testingStatus = xml.querySelector("testresult").textContent;
            
            let energyEquation = (energy / config.settings.energyDivisor) * 100;

            if (energyPolarity === "-") {
                energyBarPos.style.width = "0";

                if (energyEquation <= 100) {
                    energyBarNeg.style.width = energyEquation + "%";
                } else {
                    energyBarNeg.style.width = "100%";
                }
            } else {
                energyBarNeg.style.width = "0";

                if (energyEquation <= 100) {
                    energyBarPos.style.width = energyEquation + "%";
                } else {
                    energyBarPos.style.width = "100%";
                }
            }

            if (testingStatus === "Testing") {
                status.textContent = "Testing";
                status.style.color = "deepskyblue";
                thorName.style.color = "deepskyblue";

                if (lastActions[thor] !== "Testing") {
                    speak(config.thorGuards[thor].name + ". Is testing. The DI may change.");
                }

                lastActions[thor] = "Testing";
            } else {
                if (lightning === "AllClear") {
                    status.textContent = "All Clear";
                    status.style.color = "lime";
                    thorName.style.color = "lime";
                }

                if (lightning === "Caution") {
                    status.textContent = "Caution";
                    status.style.color = "lightgray";
                    thorName.style.color = "lightgray";
                }

                if (lightning === "Warning") {
                    status.textContent = "Warning";
                    status.style.color = "yellow";
                    thorName.style.color = "yellow";
                }

                if (lightning === "RedAlert") {
                    status.textContent = "Red Alert";
                    status.style.color = "red";
                    thorName.style.color = "red";

                    status.classList = "thor-status flashing";
                    thorName.classList = "thor-name flashing";
                } else {
                    status.classList = "thor-status";
                    thorName.classList = "thor-name";
                }

                if (lastActions[thor] !== lightning && (lightning !== "Unknown") || (lastActions[thor]) === null) {
                    speak(config.thorGuards[thor].name + ". Is on? " + lightning + ".");
                }

                if (lightning !== "Unknown") {
                    lastActions[thor] = lightning;
                }
            }

            console.log("Refreshed table " + thor);
        });

        request.open("GET", config.thorGuards[thor].data);
        request.send(null);
    }
}

build();
