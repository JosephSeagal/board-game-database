document.addEventListener("DOMContentLoaded", () => {
	const newUserNameInput = document.getElementById("newUserName");
	const newUserAgeInput = document.getElementById("newUserAge");
	const newUserBudgetInput = document.getElementById("newUserBudget");
	const createUserButton = document.getElementById("createUserButton");
	const createUserMessage = document.getElementById("createUserMessage");

	const selectedUserIdInput = document.getElementById("selectedUserId");
	const selectedUserNameInput = document.getElementById("selectedUserName");
	const loadUserButton = document.getElementById("loadUserButton");
	const selectedUserInfo = document.getElementById("selectedUserInfo");

	const updateNameInput = document.getElementById("updateName");
	const updateAgeInput = document.getElementById("updateAge");
	const updateInfoButton = document.getElementById("updateInfoButton");
	const updateInfoMessage = document.getElementById("updateInfoMessage");

	const updateBudgetInput = document.getElementById("updateBudget");
	const updateBudgetButton = document.getElementById("updateBudgetButton");
	const updateBudgetMessage = document.getElementById("updateBudgetMessage");

	const favGameIdInput = document.getElementById("favGameId");
	const setFavGameButton = document.getElementById("setFavGameButton");
	const favGameMessage = document.getElementById("favGameMessage");

	const prefGenreIdInput = document.getElementById("prefGenreId");
	const setPrefGenreButton = document.getElementById("setPrefGenreButton");
	const prefGenreMessage = document.getElementById("prefGenreMessage");

	const prefMechanicIdInput = document.getElementById("prefMechanicId");
	const setPrefMechanicButton = document.getElementById("setPrefMechanicButton");
	const prefMechanicMessage = document.getElementById("prefMechanicMessage");

	const deleteUserButton = document.getElementById("deleteUserButton");
	const deleteUserMessage = document.getElementById("deleteUserMessage");

	const currentUserText = document.getElementById("currentUserText");

	function clearAllMessages(except) {
		if (except !== "create") {
			createUserMessage.textContent = "";
			createUserMessage.className = "message";
		}
		if (except !== "load") {
			selectedUserInfo.textContent = "";
			selectedUserInfo.className = "message";
		}
		if (except !== "updateInfo") {
			updateInfoMessage.textContent = "";
			updateInfoMessage.className = "message";
		}
		if (except !== "updateBudget") {
			updateBudgetMessage.textContent = "";
			updateBudgetMessage.className = "message";
		}
		if (except !== "favGame") {
			favGameMessage.textContent = "";
			favGameMessage.className = "message";
		}
		if (except !== "prefGenre") {
			prefGenreMessage.textContent = "";
			prefGenreMessage.className = "message";
		}
		if (except !== "prefMechanic") {
			prefMechanicMessage.textContent = "";
			prefMechanicMessage.className = "message";
		}
		if (except !== "delete") {
			deleteUserMessage.textContent = "";
			deleteUserMessage.className = "message";
		}
	}

	function setMessage(elem, text, type) {
		elem.textContent = text;
		elem.className = "message" + (type ? " " + type : "");
	}

	function setCurrentUser(user) {
		if (!user) {
			currentUserText.textContent = "None";
			selectedUserIdInput.value = "";
			selectedUserNameInput.value = "";
			updateBudgetInput.value = "";
			updateNameInput.value = "";
			updateAgeInput.value = "";
			return;
		}

		const favGame = user.fav_gameid ?? user.fav_game_id ?? "none";
		const prefGenre = user.pref_genreid ?? user.pref_genre_id ?? "none";
		const prefMechanic = user.pref_mechanicid ?? user.pref_mechanic_id ?? "none";

		currentUserText.textContent =
			`id=${user.userid}, name=${user.name}, age=${user.age}, budget=${user.budget}, ` +
			`favGame=${favGame}, genre=${prefGenre}, mechanic=${prefMechanic}`;

		selectedUserIdInput.value = user.userid;
		selectedUserNameInput.value = user.name;

		updateBudgetInput.value = "";
		updateNameInput.value = "";
		updateAgeInput.value = "";
	}

	function getSelectedId() {
		const id = selectedUserIdInput.value.trim();
		return id ? Number(id) : null;
	}

	async function refreshCurrentUser(userid) {
		if (!userid) return;
		try {
			const params = new URLSearchParams();
			params.append("userid", userid);
			const r = await fetch(`/users/find?${params.toString()}`);
			if (!r.ok) return;
			const data = await r.json();
			if (data) {
				setCurrentUser(data);
			}
		} catch (err) {
			console.error("refreshCurrentUser error:", err);
		}
	}

	// Create user
	createUserButton.addEventListener("click", async () => {
		clearAllMessages("create");

		const name = newUserNameInput.value.trim();
		if (!name) {
			setMessage(createUserMessage, "Enter a name.", "error");
			return;
		}

		const age = newUserAgeInput.value.trim() || null;
		const budget = newUserBudgetInput.value.trim() || null;

		try {
			const r = await fetch("/users/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, age, budget })
			});
			const data = await r.json();

			if (!r.ok) {
				setMessage(createUserMessage, data.error || "Error.", "error");
				return;
			}

			setMessage(createUserMessage, `Created user ${data.name} (id ${data.userid})`, "success");

			setCurrentUser(data);

			newUserNameInput.value = "";
			newUserAgeInput.value = "";
			newUserBudgetInput.value = "";
		} catch (err) {
			setMessage(createUserMessage, "Server error.", "error");
		}
	});

	// Load user
	loadUserButton.addEventListener("click", async () => {
		clearAllMessages("load");

		const id = getSelectedId();
		const name = selectedUserNameInput.value.trim();

		if (!id && !name) {
			setMessage(selectedUserInfo, "Enter ID or name.", "error");
			return;
		}

		const params = new URLSearchParams();
		if (id) params.append("userid", id);
		else params.append("username", name);

		try {
			const r = await fetch(`/users/find?${params.toString()}`);
			const data = await r.json();

			if (!data) {
				setMessage(selectedUserInfo, "User not found.", "error");
				setCurrentUser(null);
				return;
			}

			setMessage(
				selectedUserInfo,
				`Selected: id=${data.userid}, name=${data.name}, budget=${data.budget}`,
				"success"
			);

			setCurrentUser(data);
		} catch (err) {
			setMessage(selectedUserInfo, "Server error.", "error");
		}
	});

	// Update name/age
	updateInfoButton.addEventListener("click", async () => {
		clearAllMessages("updateInfo");

		const id = getSelectedId();
		if (!id) {
			setMessage(updateInfoMessage, "Select a user first.", "error");
			return;
		}

		const newName = updateNameInput.value.trim();
		const newAgeVal = updateAgeInput.value.trim();
		const newAge = newAgeVal === "" ? null : newAgeVal;

		if (!newName && (newAge === null || newAge === "")) {
			setMessage(updateInfoMessage, "Enter a new name and/or age.", "error");
			return;
		}

		try {
			const r = await fetch("/users/update-info", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userid: id, name: newName || null, age: newAge })
			});
			const data = await r.json();

			if (!r.ok) {
				setMessage(updateInfoMessage, data.error || "Error.", "error");
				return;
			}

			setMessage(updateInfoMessage, "User info updated.", "success");

			await refreshCurrentUser(id);
		} catch (err) {
			setMessage(updateInfoMessage, "Server error.", "error");
		}
	});

	// Update budget
	updateBudgetButton.addEventListener("click", async () => {
		clearAllMessages("updateBudget");

		const id = getSelectedId();
		if (!id) {
			setMessage(updateBudgetMessage, "Select a user first.", "error");
			return;
		}

		const budget = updateBudgetInput.value.trim();
		if (!budget) {
			setMessage(updateBudgetMessage, "Enter a budget.", "error");
			return;
		}

		try {
			const r = await fetch("/users/update-budget", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userid: id, budget })
			});
			const data = await r.json();

			if (!r.ok) {
				setMessage(updateBudgetMessage, data.error || "Error.", "error");
				return;
			}

			setMessage(updateBudgetMessage, "Budget updated.", "success");
			await refreshCurrentUser(id);
		} catch (err) {
			setMessage(updateBudgetMessage, "Server error.", "error");
		}
	});

	// Set favorite game
	setFavGameButton.addEventListener("click", async () => {
		clearAllMessages("favGame");

		const id = getSelectedId();
		if (!id) {
			setMessage(favGameMessage, "Select a user first.", "error");
			return;
		}

		const gameid = favGameIdInput.value.trim();
		if (!gameid) {
			setMessage(favGameMessage, "Enter a game ID.", "error");
			return;
		}

		try {
			const r = await fetch("/users/set-favorite-game", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userid: id, gameid })
			});
			const data = await r.json();

			if (!r.ok) {
				setMessage(favGameMessage, data.error || "Error.", "error");
				return;
			}

			setMessage(favGameMessage, "Favorite game updated.", "success");
			await refreshCurrentUser(id);
		} catch (err) {
			setMessage(favGameMessage, "Server error.", "error");
		}
	});

	// Set preferred genre
	setPrefGenreButton.addEventListener("click", async () => {
		clearAllMessages("prefGenre");

		const id = getSelectedId();
		if (!id) {
			setMessage(prefGenreMessage, "Select a user first.", "error");
			return;
		}

		const genreid = prefGenreIdInput.value.trim();
		if (!genreid) {
			setMessage(prefGenreMessage, "Enter a genre ID.", "error");
			return;
		}

		try {
			const r = await fetch("/users/set-preferred-genre", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userid: id, genreid })
			});
			const data = await r.json();

			if (!r.ok) {
				setMessage(prefGenreMessage, data.error || "Error.", "error");
				return;
			}

			setMessage(prefGenreMessage, "Preferred genre updated.", "success");
			await refreshCurrentUser(id);
		} catch (err) {
			setMessage(prefGenreMessage, "Server error.", "error");
		}
	});

	// Set preferred mechanic
	setPrefMechanicButton.addEventListener("click", async () => {
		clearAllMessages("prefMechanic");

		const id = getSelectedId();
		if (!id) {
			setMessage(prefMechanicMessage, "Select a user first.", "error");
			return;
		}

		const mechanicid = prefMechanicIdInput.value.trim();
		if (!mechanicid) {
			setMessage(prefMechanicMessage, "Enter a mechanic ID.", "error");
			return;
		}

		try {
			const r = await fetch("/users/set-preferred-mechanic", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userid: id, mechanicid })
			});
			const data = await r.json();

			if (!r.ok) {
				setMessage(prefMechanicMessage, data.error || "Error.", "error");
				return;
			}

			setMessage(prefMechanicMessage, "Preferred mechanic updated.", "success");
			await refreshCurrentUser(id);
		} catch (err) {
			setMessage(prefMechanicMessage, "Server error.", "error");
		}
	});

	// Delete user
	deleteUserButton.addEventListener("click", async () => {
		clearAllMessages("delete");

		const id = getSelectedId();
		if (!id) {
			setMessage(deleteUserMessage, "Select a user first.", "error");
			return;
		}

		if (!confirm("Delete this user?")) return;

		try {
			const r = await fetch("/users/delete", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userid: id })
			});
			const data = await r.json();

			if (!r.ok) {
				setMessage(deleteUserMessage, data.error || "Error.", "error");
				return;
			}

			setMessage(deleteUserMessage, `Deleted user ${data.name}.`, "success");
			setCurrentUser(null);
		} catch (err) {
			setMessage(deleteUserMessage, "Server error.", "error");
		}
	});
});
