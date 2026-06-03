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

	// Taille virtuelle fixe pour maintenir le calcul des équations géométriques homogène
	const CANVAS_SIZE = 800;
	canvas.width = CANVAS_SIZE;
	canvas.height = CANVAS_SIZE;

	// Registre global des nœuds de la constellation
	// Structure d'un nœud : { id: string, label: string, x: num, y: num, size: num, angle: num, originStep: num }
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

	// Efface chirurgicalement les ronds créés à une étape précise lors d'un clic "Retour"
	function purgeNodesFromStep(stepNumber) {
		graphNodes = graphNodes.filter((node) => node.originStep !== stepNumber);
		renderGraph();
	}

	// --- Accueil -> Étape 1 ---
	document
		.getElementById("start-adventure-btn")
		.addEventListener("click", () => {
			transitionTo(stepWelcome, step1);
		});

	// --- Étape 1 -> Étape 2 ---
	document.getElementById("btn-goto-step2").addEventListener("click", () => {
		const uName = document.getElementById("user-firstname").value.trim();
		if (!uName) {
			alert("S'il te plaît, écris ton prénom pour commencer la constellation.");
			return;
		}
		captureIdentityAndSiblings();
		buildDynamicInputs();
		calculateSharedYears(); // Calcul initial lors du passage à l'étape 2
		transitionTo(step1, step2);
		renderGraph();
	});

	// --- Étape 2 -> Étape 1 (Retour) ---
	document.getElementById("btn-back-to-step1").addEventListener("click", () => {
		purgeNodesFromStep(1); // Efface "Moi" et les frères/sœurs du canvas
		purgeNodesFromStep(2); // Purge de sécurité si des dates existaient déjà
		transitionTo(step2, step1);
	});

	// --- Étape 2 -> Étape 3 ---
	document.getElementById("btn-goto-step3").addEventListener("click", () => {
		calculateSharedYears();
		transitionTo(step2, step3);
	});

	// --- Étape 3 -> Étape 2 (Retour) ---
	document.getElementById("btn-back-to-step2").addEventListener("click", () => {
		purgeNodesFromStep(2); // Supprime les ronds des années
		transitionTo(step3, step2);
	});

	// --- Étape 3 -> Étape 4 ---
	document.getElementById("btn-goto-step4").addEventListener("click", () => {
		transitionTo(step3, step4);
	});

	// --- Étape 4 -> Étape 3 (Retour) ---
	document.getElementById("btn-back-to-step3").addEventListener("click", () => {
		purgeNodesFromStep(3); // Supprime les ronds de souvenirs
		transitionTo(step4, step3);
	});

	// --- Bouton Finalisation Définitive -> Ouverture de la Modale ---
	document
		.getElementById("btn-generate-final")
		.addEventListener("click", () => {
			renderGraph();
			openShareModal();
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
		graphNodes = []; // Réinitialisation complète
		const userFirstname =
			document.getElementById("user-firstname").value.trim() || "Moi";

		// Nœud central utilisateur (Étape 1) - ID unique
		createSmartNode("user-main", userFirstname, 26 + Math.random() * 6, 1);

		// Nœuds de la fratrie (Étape 1)
		document.querySelectorAll(".sibling-name-input").forEach((input, index) => {
			const name = input.value.trim();
			if (name) {
				createSmartNode(`sib-${index}`, name, 18 + Math.random() * 6, 1);
			}
		});
	}

	// =========================================================================
	// 4. ALGORITHME DE RÉPULSION GÉOMÉTRIQUE (Anti-collision)
	// =========================================================================
	function createSmartNode(nodeId, labelText, chosenSize, stepId) {
		// CORRECTION : Si un nœud possédant le même ID existe déjà (ex: modification de date),
		// on le supprime avant de recalculer sa position pour éviter l'effet de duplication.
		graphNodes = graphNodes.filter((node) => node.id !== nodeId);

		const center = CANVAS_SIZE / 2;
		const maxRadius = 250;
		let x,
			y,
			attempts = 0,
			minDistanceFound = 0;

		// Zone tampon minimale (en pixels) requise pour qu'un mot ne chevauche pas un autre
		const safetyMargin = 105;

		do {
			// Distribution polaire en disque pour éviter l'alignement matriciel rigide
			const angle = Math.random() * Math.PI * 2;
			const radius = 60 + Math.random() * maxRadius;
			x = center + Math.cos(angle) * radius;
			y = center + Math.sin(angle) * radius;

			minDistanceFound = Infinity;
			// Comparaison vectorielle avec tous les éléments déjà implantés
			for (let node of graphNodes) {
				const dist = Math.hypot(x - node.x, y - node.y);
				if (dist < minDistanceFound) minDistanceFound = dist;
			}
			attempts++;
		} while (minDistanceFound < safetyMargin && attempts < 150);

		// Calcul de l'angle d'orientation par rapport au centre absolu du cadre
		const finalAngle = Math.atan2(y - center, x - center);

		graphNodes.push({
			id: nodeId,
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

		// Exclusion du point 0 (Moi) pour générer les formulaires des frères/sœurs
		const siblings = graphNodes.slice(1);

		siblings.forEach((sib, index) => {
			// Étape 2 : Bloc Date UX Intuitif
			const blockDate = document.createElement("div");
			blockDate.className = "sibling-block";
			blockDate.innerHTML = `
                <div class="sibling-tag">${sib.label}</div>
                <div><input type="date" class="date-ux-input sib-date-input" /></div>
            `;
			siblingDatesContainer.appendChild(blockDate);

			// CORRECTION : Écouteur basé sur 'change' pour capturer nativement la sélection du calendrier
			blockDate
				.querySelector(".sib-date-input")
				.addEventListener("change", (e) => {
					if (e.target.value) {
						const year = e.target.value.split("-")[0];
						if (year && year.length === 4) {
							// On vérifie que l'année saisie est complète
							handleLiveTextInput(`date-${index}`, year, 2);
						}
					} else {
						// Si le champ est vidé, on retire le nœud
						graphNodes = graphNodes.filter(
							(node) => node.id !== `date-${index}`,
						);
						renderGraph();
					}
				});

			// Étape 3 : Blocs Souvenirs
			const blockMem = document.createElement("div");
			blockMem.className = "sib-col";
			blockMem.innerHTML = `
                <div class="sib-header">${sib.label}</div>
                <ul>
                    <li><input type="text" class="live-input memory-in-${index}-1" placeholder="Un lieu cher..."></li>
                    <li><input type="text" class="live-input memory-in-${index}-2" placeholder="Un souvenir marquant..."></li>
                </ul>
            `;
			siblingMemoriesContainer.appendChild(blockMem);

			blockMem
				.querySelectorAll(`[class^="live-input memory-in-${index}"]`)
				.forEach((input, inputIdx) => {
					input.addEventListener("blur", (e) => {
						const text = e.target.value.trim();
						if (text) {
							handleLiveTextInput(`mem-${index}-${inputIdx}`, text, 3);
						} else {
							// Nettoyage si l'utilisateur efface son texte entièrement
							graphNodes = graphNodes.filter(
								(node) => node.id !== `mem-${index}-${inputIdx}`,
							);
							renderGraph();
						}
					});
				});

			// Étape 4 : Blocs Mots-clés
			const blockKey = document.createElement("div");
			blockKey.className = "sib-col";
			blockKey.innerHTML = `
                <div class="sib-header">${sib.label}</div>
                <ul>
                    <li><input type="text" class="live-input keyword-in-${index}-1" placeholder="Ex: Complicité"></li>
                    <li><input type="text" class="live-input keyword-in-${index}-2" placeholder="Ex: Rires"></li>
                </ul>
            `;
			siblingKeywordsContainer.appendChild(blockKey);

			blockKey
				.querySelectorAll(`[class^="live-input keyword-in-${index}"]`)
				.forEach((input, inputIdx) => {
					input.addEventListener("blur", (e) => {
						const text = e.target.value.trim();
						if (text) {
							handleLiveTextInput(`key-${index}-${inputIdx}`, text, 4);
						} else {
							// Nettoyage si l'utilisateur efface son texte entièrement
							graphNodes = graphNodes.filter(
								(node) => node.id !== `key-${index}-${inputIdx}`,
							);
							renderGraph();
						}
					});
				});
		});
	}

	function handleLiveTextInput(nodeId, text, stepId) {
		// Distribution de taille asymétrique (gros et petits points entremêlés)
		const dynamicSize = 5 + Math.random() * Math.random() * 34;
		createSmartNode(nodeId, text, dynamicSize, stepId);
		renderGraph();
	}

	// CORRECTIF D'INTERFAÇAGE : Extraction des données depuis les balises <select>
	function calculateSharedYears() {
		const yearSelect = document.getElementById("user-birth-year");
		let userYear = parseInt(yearSelect.value, 10);

		if (isNaN(userYear)) {
			userYear = 2000; // Année de repli sécuritaire
		}

		const currentYear = new Date().getFullYear();
		const sharedYears = currentYear - userYear;
		document.getElementById("years-shared").textContent = `${sharedYears} ans`;

		// Mise à jour de l'étiquette centrale de l'utilisateur sur le canvas
		const userFirstname =
			document.getElementById("user-firstname").value.trim() || "Moi";
		createSmartNode("user-main", `${userFirstname} (${userYear})`, 30, 1);
		renderGraph();
	}

	// Écouteur pour mettre à jour la constellation dès que l'étudiant change l'année
	document
		.getElementById("user-birth-year")
		.addEventListener("change", calculateSharedYears);

	// =========================================================================
	// 6. MOTEUR DE RENDU (Masquage Anti-chevauchement / Masque Invisible)
	// =========================================================================
	function renderGraph() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		clearCanvas();

		if (graphNodes.length < 1) return;

		// --- PASSE A : Le Maillage Interconnecté ---
		for (let i = 0; i < graphNodes.length; i++) {
			for (let j = i + 1; j < graphNodes.length; j++) {
				const nodeA = graphNodes[i];
				const nodeB = graphNodes[j];

				const distance = Math.hypot(nodeB.x - nodeA.x, nodeB.y - nodeA.y);

				// Opacité et épaisseur calculées par rapport à la distance (Profondeur cosmique)
				let opacity = Math.max(0.12, 0.75 - distance / CANVAS_SIZE);
				let lineWidth = Math.max(0.6, 3.8 - distance / 180);

				// Valorise l'épaisseur si deux nœuds majeurs se croisent
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

		// --- PASSE B : Les Étoiles (Disques Blancs) ---
		graphNodes.forEach((node) => {
			ctx.beginPath();
			ctx.fillStyle = "#ffffff";
			ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
			ctx.fill();
		});

		// --- PASSE C : Les Noms (Masquage & Projection Polaire) ---
		graphNodes.forEach((node) => {
			ctx.save();
			ctx.font = "italic 700 15px 'Nunito', sans-serif";
			ctx.textBaseline = "middle";

			const cos = Math.cos(node.angle);
			const sin = Math.sin(node.angle);

			// Écartement du label calculé selon le diamètre de l'étoile
			const textGap = node.size + 12;
			const textX = node.x + cos * textGap;
			const textY = node.y + sin * textGap;

			// Alignement intelligent dynamique
			if (cos > 0.3) {
				ctx.textAlign = "left";
			} else if (cos < -0.3) {
				ctx.textAlign = "right";
			} else {
				ctx.textAlign = "center";
			}

			// TECHNIQUE DU MASQUE INVISIBLE
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 5;
			ctx.strokeText(node.label, textX, textY);

			// Impression finale des lettres en blanc pur
			ctx.fillStyle = "#ffffff";
			ctx.fillText(node.label, textX, textY);

			ctx.restore();
		});
	}

	// =========================================================================
	// 7. MODULE DE PARTAGE, RÉCAPITULATIF ET MODALE FINALE
	// =========================================================================
	const shareModal = document.getElementById("share-modal");
	const closeScaleBtn = document.getElementById("close-modal-btn");
	const shareTextPreview = document.getElementById("share-text-preview");

	function openShareModal() {
		const userFirstname =
			document.getElementById("user-firstname").value.trim() || "Moi";
		const nbSiblings = parseInt(nbSiblingsSelect.value, 10);
		const yearsSharedText = document.getElementById("years-shared").textContent;

		let siblingNames = [];
		document.querySelectorAll(".sibling-name-input").forEach((input) => {
			if (input.value.trim()) siblingNames.push(input.value.trim());
		});
		const siblingsListText =
			siblingNames.length > 0
				? siblingNames.join(", ")
				: `${nbSiblings} frères/sœurs`;

		const messageOfficial = `Je viens de cartographier ma constellation fraternelle ! ✨ Avec ${siblingsListText}, cela fait déjà ${yearsSharedText} que nous partageons nos vies, nos rires et nos souvenirs.\n\nComme moi, visualisez vos liens uniques et soutenez l'action de Fondation Villages d'Enfance Ensemble pour que chaque fratrie grandisse ensemble. 💙 #FondationVillagesdEnfanceEnsemble #LiensFraternels https://fondationvee.org/`;

		shareTextPreview.value = messageOfficial;

		const urlEncodedMessage = encodeURIComponent(messageOfficial);
		const shareUrl = encodeURIComponent("https://fondationvee.org/");

		document.getElementById("share-twitter").href =
			`https://twitter.com/intent/tweet?text=${urlEncodedMessage}`;
		document.getElementById("share-facebook").href =
			`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
		document.getElementById("share-linkedin").href =
			`https://www.linkedin.com/sharing/share-offsite/?u=${shareUrl}`;
		document.getElementById("share-whatsapp").href =
			`https://api.whatsapp.com/send?text=${urlEncodedMessage}`;

		shareModal.style.display = "flex";
	}

	closeScaleBtn.addEventListener("click", () => {
		shareModal.style.display = "none";
	});
	shareModal.addEventListener("click", (e) => {
		if (e.target === shareModal) shareModal.style.display = "none";
	});

	document.getElementById("btn-copy-text").addEventListener("click", () => {
		shareTextPreview.select();
		shareTextPreview.setSelectionRange(0, 99999);

		navigator.clipboard
			.writeText(shareTextPreview.value)
			.then(() => {
				const copyBtn = document.getElementById("btn-copy-text");
				copyBtn.textContent = "Copié ! En route pour vos réseaux... ✅";
				copyBtn.style.backgroundColor = "#25D366";
				copyBtn.style.color = "#ffffff";

				setTimeout(() => {
					copyBtn.textContent = "Copier le message 📋";
					copyBtn.style.backgroundColor = "var(--yellow)";
					copyBtn.style.color = "#332000";
				}, 2500);
			})
			.catch(() => {
				alert(
					"Erreur lors de la copie automatique, vous pouvez copier le texte manuellement.",
				);
			});
	});

	// =========================================================================
	// 8. MODULES DE TÉLÉCHARGEMENT ET RESET GLOBAL
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
