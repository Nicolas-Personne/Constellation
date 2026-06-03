/**
 * Gestion de l'UX des champs de sélection de dates de naissance
 */
document.addEventListener("DOMContentLoaded", function () {
	const daySelect = document.getElementById("user-birth-day");
	const yearSelect = document.getElementById("user-birth-year");

	// 1. Génération des jours (01 à 31)
	if (daySelect) {
		for (let i = 1; i <= 31; i++) {
			const option = document.createElement("option");
			option.value = i < 10 ? "0" + i : i.toString();
			option.textContent = i;
			daySelect.appendChild(option);
		}
	}

	// 2. Génération des années (De l'année courante - 5 ans jusqu'à 1930)
	if (yearSelect) {
		const currentYear = new Date().getFullYear(); // Récupère dynamiquement l'année en cours
		const startYear = currentYear - 5; // Décale pour éviter de cibler des nouveaux-nés par défaut
		const endYear = 1930;

		for (let i = startYear; i >= endYear; i--) {
			const option = document.createElement("option");
			option.value = i.toString();
			option.textContent = i;
			yearSelect.appendChild(option);
		}
	}
});
