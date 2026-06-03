document.addEventListener("DOMContentLoaded", () => {
	// =========================================================================
	// ANCRAGES & INITIALISATION CANVAS
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

	// Structure globale des points
	let graphNodes = [];

	function clearCanvas() {
		ctx.fillStyle = "#000000";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}
	clearCanvas();

	// =========================================================================
	// MOTEUR DU PARCOURS MULTI-STEP (NAVIGATION ÉTAPE PAR ÉTAPE)
	// =========================================================================
	const stepWelcome = document.getElementById("step-welcome");
	const step1 = document.getElementById("step-1");
	const step2 = document.getElementById("step-2");
	const step3 = document.getElementById("step-3");
	const step4 = document.getElementById("step-4");

	// Bouton de l'accueil
	document
		.getElementById("start-adventure-btn")
		.addEventListener("click", () => {
			stepWelcome.style.display = "none";
			step1.style.display = "block";
		});

	// Étape 1 -> Étape 2
	document.getElementById("btn-goto-step2").addEventListener("click", () => {
		const uName = document.getElementById("user-firstname").value.trim();
		if (!uName) {
			alert("Veuillez entrer votre prénom pour continuer.");
			return;
		}
		captureIdentityAndSiblings();
		buildDynamicInputs();

		step1.style.display = "none";
		step2.style.display = "block";
		renderGraph();
	});

	// Étape 2 -> Étape 3
	document.getElementById("btn-goto-step3").addEventListener("click", () => {
		calculateSharedYears();
		step2.style.display = "none";
		step3.style.display = "block";
	});

	// Étape 3 -> Étape 4
	document.getElementById("btn-goto-step4").addEventListener("click", () => {
		step3.style.display = "none";
		step4.style.display = "block";
	});

	// Étape Finale
	document
		.getElementById("btn-generate-final")
		.addEventListener("click", () => {
			renderGraph();
			alert("Votre constellation personnalisée est prête à être téléchargée !");
		});

	// =========================================================================
	// DYNAMISATION DES INPUTS ET CRÉATION DE NŒUDS
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

		// Point central de l'utilisateur principal
		createSmartNode(userFirstname, 25 + Math.random() * 10);

		// Intégration de la fratrie
		document.querySelectorAll(".sibling-name-input").forEach((input) => {
			const name = input.value.trim();
			if (name) {
				createSmartNode(name, 18 + Math.random() * 10);
			}
		});
	}

	// Algorithme de répulsion géométrique anti-collision
	function createSmartNode(labelText, chosenSize) {
		const center = CANVAS_SIZE / 2;
		const maxRadius = 250;
		let x,
			y,
			attempts = 0,
			minDistanceFound = 0;
		const safetyMargin = 100; // Espace requis pour ne pas écraser les prénoms

		do {
			const angle = Math.random() * Math.PI * 2;
			const radius = 50 + Math.random() * maxRadius;
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
		});
	}

	function buildDynamicInputs() {
		siblingDatesContainer.innerHTML = "";
		siblingMemoriesContainer.innerHTML = "";
		siblingKeywordsContainer.innerHTML = "";

		// On exclut le point 0 (Moi) pour ne garder que la fratrie
		const siblings = graphNodes.slice(1);

		siblings.forEach((sib) => {
			// Injection Étape Âges
			const blockDate = document.createElement("div");
			blockDate.className = "sibling-block";
			blockDate.innerHTML = `
                <div class="sibling-tag">${sib.label}</div>
                <div class="date-row">
                    <select class="select-pill sib-year-select">
                        <option value="">Année</option>
                        <option value="1998">1998</option>
                        <option value="2002">2002</option>
                        <option value="2005">2005</option>
                        <option value="2010">2010</option>
                    </select>
                </div>
            `;
			siblingDatesContainer.appendChild(blockDate);
			blockDate
				.querySelector(".sib-year-select")
				.addEventListener("change", (e) => {
					if (e.target.value) handleLiveTextInput(`Né(e) en ${e.target.value}`);
				});

			// Injection Étape Souvenirs
			const blockMem = document.createElement("div");
			blockMem.className = "sib-col";
			blockMem.innerHTML = `
                <div class="sib-header">${sib.label}</div>
                <ul>
                    <li><input type="text" class="live-input" placeholder="Un souvenir..."></li>
                    <li><input type="text" class="live-input" placeholder="Un grand moment..."></li>
                </ul>
            `;
			siblingMemoriesContainer.appendChild(blockMem);

			// Injection Étape Mots-clés
			const blockKey = document.createElement("div");
			blockKey.className = "sib-col";
			blockKey.innerHTML = `
                <div class="sib-header">${sib.label}</div>
                <ul>
                    <li><input type="text" class="live-input" placeholder="Un adjectif..."></li>
                    <li><input type="text" class="live-input" placeholder="Un sentiment..."></li>
                </ul>
            `;
			siblingKeywordsContainer.appendChild(blockKey);
		});

		// Liaison des écouteurs de floutage pour mise à jour instantanée du canvas
		document.querySelectorAll(".live-input").forEach((input) => {
			input.addEventListener("blur", (e) => {
				const text = e.target.value.trim();
				if (text) handleLiveTextInput(text);
			});
		});
	}

	function handleLiveTextInput(text) {
		if (graphNodes.some((n) => n.label === text)) return;
		// Tailles hautement aléatoires (gros points asymétriques à la demande)
		const dynamicSize = 4 + Math.random() * Math.random() * 38;
		createSmartNode(text, dynamicSize);
		renderGraph();
	}

	function calculateSharedYears() {
		const uYear =
			parseInt(document.querySelector(".user-birth-year").value, 10) || 2000;
		document.getElementById("years-shared").textContent =
			`${new Date().getFullYear() - uYear} ans`;
	}

	// =========================================================================
	// RENDU DU GRAPH INTERCONNECTÉ CLAIR ET BIEN ALIGNÉ
	// =========================================================================
	function renderGraph() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		clearCanvas();

		if (graphNodes.length < 1) return;

		// Liaison maillée totale entre tous les points
		for (let i = 0; i < graphNodes.length; i++) {
			for (let j = i + 1; j < graphNodes.length; j++) {
				const nodeA = graphNodes[i];
				const nodeB = graphNodes[j];

				const distance = Math.hypot(nodeB.x - nodeA.x, nodeB.y - nodeA.y);
				let opacity = Math.max(0.12, 0.75 - distance / CANVAS_SIZE);
				let lineWidth = Math.max(0.6, 4.0 - distance / 180);

				if (nodeA.size > 20 && nodeB.size > 20) {
					lineWidth += 1.5;
					opacity = Math.min(1, opacity + 0.2);
				}

				ctx.beginPath();
				ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
				ctx.lineWidth = lineWidth;
				ctx.moveTo(nodeA.x, nodeA.y);
				ctx.lineTo(nodeB.x, nodeB.y);
				ctx.stroke();
			}
		}

		// Dessin des disques pleins blancs contrastés
		graphNodes.forEach((node) => {
			ctx.beginPath();
			ctx.fillStyle = "#ffffff";
			ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
			ctx.fill();
		});

		// Écriture des labels avec masque anti-chevauchement
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

			// Masque d'effacement arrière-plan (Bordure invisible)
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 5;
			ctx.strokeText(node.label, textX, textY);

			// Rendu final blanc pur du texte
			ctx.fillStyle = "#ffffff";
			ctx.fillText(node.label, textX, textY);
			ctx.restore();
		});
	}

	// =========================================================================
	// EXPORTATION & RÉINITIALISATION
	// =========================================================================
	document.getElementById("download-btn").addEventListener("click", () => {
		const link = document.createElement("a");
		link.href = canvas.toDataURL("image/png");
		link.download = "ma-constellation-reparée.png";
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
