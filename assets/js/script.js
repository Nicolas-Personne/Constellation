document.addEventListener("DOMContentLoaded", () => {
	// =========================================================================
	// 1. CHASSIS TECHNIQUE ET ANCRAGE CANVAS
	// =========================================================================
	const canvas = document.getElementById("constellation");
	const ctx = canvas.getContext("2d");

	const nbSiblingsSelect = document.getElementById("nb-siblings");
	const namesRow = document.getElementById("names-row");
	const siblingDatesContainer = document.getElementById(
		"sibling-dates-container",
	);
	const siblingMemoriesContainer = document.getElementById(
		"sibling-memories-container",
	);
	const siblingKeywordsContainer = document.getElementById(
		"sibling-keywords-container",
	);

	const CANVAS_SIZE = 800;
	canvas.width = CANVAS_SIZE;
	canvas.height = CANVAS_SIZE;

	let graphNodes = [];

	function clearCanvas() {
		ctx.fillStyle = "#000000";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}
	clearCanvas();

	// =========================================================================
	// 2. LOGIQUE DU ROUTAGE MULTI-STEP ET HISTORIQUE D'ANNULATION
	// =========================================================================
	const stepWelcome = document.getElementById("step-welcome");
	const step1 = document.getElementById("step-1");
	const step2 = document.getElementById("step-2");
	const step3 = document.getElementById("step-3");
	const step4 = document.getElementById("step-4");

	function transitionTo(fromStep, toStep) {
		fromStep.style.display = "none";
		toStep.style.display = "block";
	}

	function purgeNodesFromStep(stepNumber) {
		graphNodes = graphNodes.filter((node) => node.originStep !== stepNumber);
		renderGraph();
	}

	document
		.getElementById("start-adventure-btn")
		.addEventListener("click", () => {
			transitionTo(stepWelcome, step1);
		});

	document.getElementById("btn-goto-step2").addEventListener("click", () => {
		const uName = document.getElementById("user-firstname").value.trim();
		if (!uName) {
			alert("S'il te plaît, écris ton prénom pour commencer la constellation.");
			return;
		}
		captureIdentityAndSiblings();
		buildDynamicInputs();
		transitionTo(step1, step2);
		renderGraph();
	});

	document.getElementById("btn-back-to-step1").addEventListener("click", () => {
		purgeNodesFromStep(1);
		purgeNodesFromStep(2);
		transitionTo(step2, step1);
	});

	document.getElementById("btn-goto-step3").addEventListener("click", () => {
		calculateSharedYears();
		transitionTo(step2, step3);
	});

	document.getElementById("btn-back-to-step2").addEventListener("click", () => {
		purgeNodesFromStep(2);
		transitionTo(step3, step2);
	});

	document.getElementById("btn-goto-step4").addEventListener("click", () => {
		transitionTo(step3, step4);
	});

	document.getElementById("btn-back-to-step3").addEventListener("click", () => {
		purgeNodesFromStep(3);
		transitionTo(step4, step3);
	});

	document
		.getElementById("btn-generate-final")
		.addEventListener("click", () => {
			renderGraph();
			alert(
				"Magnifique ! Ta constellation familiale interconnectée est entièrement générée.",
			);
		});

	// =========================================================================
	// 3. CAPTURE DE L'ÉCHAFAUDAGE INITIAL (Étape 1)
	// =========================================================================
	function updateNamesLayout() {
		const count = parseInt(nbSiblingsSelect.value, 10);
		namesRow.innerHTML = "";
		for (let i = 0; i < count; i++) {
			const input = document.createElement("input");
			input.type = "text";
			input.className = "pill-input sibling-name-input";
			input.placeholder = `Prénom ${i + 1}`;
			namesRow.appendChild(input);
		}
	}
	nbSiblingsSelect.addEventListener("change", updateNamesLayout);
	updateNamesLayout();

	function captureIdentityAndSiblings() {
		graphNodes = [];
		const userFirstname =
			document.getElementById("user-firstname").value.trim() || "Moi";

		createSmartNode(userFirstname, 26 + Math.random() * 6, 1);

		document.querySelectorAll(".sibling-name-input").forEach((input) => {
			const name = input.value.trim();
			if (name) {
				createSmartNode(name, 18 + Math.random() * 6, 1);
			}
		});
	}

	// =========================================================================
	// 4. ALGORITHME DE RÉPULSION GÉOMÉTRIQUE (Anti-collision)
	// =========================================================================
	function createSmartNode(labelText, chosenSize, stepId) {
		const center = CANVAS_SIZE / 2;
		const maxRadius = 250;
		let x,
			y,
			attempts = 0,
			minDistanceFound = 0;
		const safetyMargin = 105;

		do {
			const angle = Math.random() * Math.PI * 2;
			const radius = 60 + Math.random() * maxRadius;
			x = center + Math.cos(angle) * radius;
			y = center + Math.sin(angle) * radius;

			minDistanceFound = Infinity;
			for (let node of graphNodes) {
				const dist = Math.hypot(x - node.x, y - node.y);
				if (dist < minDistanceFound) minDistanceFound = dist;
			}
			attempts++;
		} while (minDistanceFound < safetyMargin && attempts < 150);

		const finalAngle = Math.atan2(y - center, x - center);

		graphNodes.push({
			label: labelText,
			x: x,
			y: y,
			size: chosenSize,
			angle: finalAngle,
			originStep: stepId,
		});
	}

	// =========================================================================
	// 5. SECTIONS DYNAMIQUES ET CHANNELS INPUT-LIVE
	// =========================================================================
	function buildDynamicInputs() {
		siblingDatesContainer.innerHTML = "";
		siblingMemoriesContainer.innerHTML = "";
		siblingKeywordsContainer.innerHTML = "";

		const siblings = graphNodes.slice(1);

		siblings.forEach((sib) => {
			// Étape 2 : Bloc Date
			const blockDate = document.createElement("div");
			blockDate.className = "sibling-block";
			blockDate.innerHTML = `
                <div class="sibling-tag">${sib.label}</div>
                <div><input type="date" class="date-ux-input sib-date-input" /></div>
            `;
			siblingDatesContainer.appendChild(blockDate);

			blockDate
				.querySelector(".sib-date-input")
				.addEventListener("change", (e) => {
					if (e.target.value) {
						const year = e.target.value.split("-")[0];
						// CORRECTION CORTE : On affiche uniquement l'année (ex: "2002") pour éviter le débordement
						handleLiveTextInput(year, 2);
					}
				});

			// Étape 3 : Blocs Souvenirs
			const blockMem = document.createElement("div");
			blockMem.className = "sib-col";
			blockMem.innerHTML = `
                <div class="sib-header">${sib.label}</div>
                <ul>
                    <li><input type="text" class="live-input memory-in" placeholder="Un lieu cher..."></li>
                    <li><input type="text" class="live-input memory-in" placeholder="Un souvenir marquant..."></li>
                </ul>
            `;
			siblingMemoriesContainer.appendChild(blockMem);

			// Étape 4 : Blocs Mots-clés
			const blockKey = document.createElement("div");
			blockKey.className = "sib-col";
			blockKey.innerHTML = `
                <div class="sib-header">${sib.label}</div>
                <ul>
                    <li><input type="text" class="live-input keyword-in" placeholder="Ex: Complicité"></li>
                    <li><input type="text" class="live-input keyword-in" placeholder="Ex: Rires"></li>
                </ul>
            `;
			siblingKeywordsContainer.appendChild(blockKey);
		});

		document.querySelectorAll(".memory-in").forEach((input) => {
			input.addEventListener("blur", (e) => {
				const text = e.target.value.trim();
				if (text) handleLiveTextInput(text, 3);
			});
		});

		document.querySelectorAll(".keyword-in").forEach((input) => {
			input.addEventListener("blur", (e) => {
				const text = e.target.value.trim();
				if (text) handleLiveTextInput(text, 4);
			});
		});
	}

	function handleLiveTextInput(text, stepId) {
		if (graphNodes.some((n) => n.label === text)) return;

		const dynamicSize = 5 + Math.random() * Math.random() * 34;
		createSmartNode(text, dynamicSize, stepId);
		renderGraph();
	}

	function calculateSharedYears() {
		const inputUser = document.querySelector(".user-birth-date").value;
		let userYear = 2000;
		if (inputUser) {
			userYear = parseInt(inputUser.split("-")[0], 10);
		}
		const currentYear = new Date().getFullYear();
		document.getElementById("years-shared").textContent =
			`${currentYear - userYear} ans`;
	}

	// =========================================================================
	// 6. MOTEUR DE RENDU (Masquage Anti-chevauchement)
	// =========================================================================
	function renderGraph() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		clearCanvas();

		if (graphNodes.length < 1) return;

		// --- Lignes de maillage ---
		for (let i = 0; i < graphNodes.length; i++) {
			for (let j = i + 1; j < graphNodes.length; j++) {
				const nodeA = graphNodes[i];
				const nodeB = graphNodes[j];

				const distance = Math.hypot(nodeB.x - nodeA.x, nodeB.y - nodeA.y);

				let opacity = Math.max(0.12, 0.75 - distance / CANVAS_SIZE);
				let lineWidth = Math.max(0.6, 3.8 - distance / 180);

				if (nodeA.size > 20 && nodeB.size > 20) {
					lineWidth += 1.2;
					opacity = Math.min(1, opacity + 0.15);
				}

				ctx.beginPath();
				ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
				ctx.lineWidth = lineWidth;
				ctx.moveTo(nodeA.x, nodeA.y);
				ctx.lineTo(nodeB.x, nodeB.y);
				ctx.stroke();
			}
		}

		// --- Disques blancs ---
		graphNodes.forEach((node) => {
			ctx.beginPath();
			ctx.fillStyle = "#ffffff";
			ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
			ctx.fill();
		});

		// --- Textes avec masque noir ---
		graphNodes.forEach((node) => {
			ctx.save();
			ctx.font = "italic 700 15px 'Nunito', sans-serif";
			ctx.textBaseline = "middle";

			const cos = Math.cos(node.angle);
			const sin = Math.sin(node.angle);

			const textGap = node.size + 12;
			const textX = node.x + cos * textGap;
			const textY = node.y + sin * textGap;

			if (cos > 0.3) {
				ctx.textAlign = "left";
			} else if (cos < -0.3) {
				ctx.textAlign = "right";
			} else {
				ctx.textAlign = "center";
			}

			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 5;
			ctx.strokeText(node.label, textX, textY);

			ctx.fillStyle = "#ffffff";
			ctx.fillText(node.label, textX, textY);

			ctx.restore();
		});
	}

	// =========================================================================
	// 7. MODULES DE TÉLÉCHARGEMENT ET RESET GLOBAL
	// =========================================================================
	document.getElementById("download-btn").addEventListener("click", () => {
		const link = document.createElement("a");
		link.href = canvas.toDataURL("image/png");
		link.download = "ma-constellation-fraternelle.png";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	});

	document.getElementById("reset-btn").addEventListener("click", () => {
		graphNodes = [];
		clearCanvas();
		stepWelcome.style.display = "block";
		step1.style.display = "none";
		step2.style.display = "none";
		step3.style.display = "none";
		step4.style.display = "none";
		document.getElementById("user-firstname").value = "";
		updateNamesLayout();
	});
});
