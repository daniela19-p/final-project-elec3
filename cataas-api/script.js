// Cataas Playground logic
(function () {
	const API = "https://cataas.com";

	// DOM (simplified)
	const tagSelect = document.getElementById("tagSelect");

	const randomBtn = document.getElementById("randomBtn");
	const copyBtn = document.getElementById("copyBtn");
	const downloadBtn = document.getElementById("downloadBtn");
	const statusEl = document.getElementById("status");
	const img = document.getElementById("preview");
	const themeToggle = document.getElementById("themeToggle");

	// Theme
	function initTheme() {
		const saved = localStorage.getItem("cataas_theme");
		const theme = saved || "dark";
		document.documentElement.setAttribute("data-theme", theme);
		themeToggle.textContent = theme === "light" ? "🌙" : "☀️";
	}
	function toggleTheme() {
		const curr = document.documentElement.getAttribute("data-theme") || "dark";
		const next = curr === "dark" ? "light" : "dark";
		document.documentElement.setAttribute("data-theme", next);
		localStorage.setItem("cataas_theme", next);
		themeToggle.textContent = next === "light" ? "🌙" : "☀️";
	}

	// Helpers
	function pickRandom(arr) {
		if (!arr?.length) return "";
		return arr[Math.floor(Math.random() * arr.length)];
	}

	function buildUrl() {
		const tag = tagSelect.value.trim();

		// Simple path: /cat or /cat/<tag>
		let pathParts = ["cat"];
		if (tag) pathParts.push(encodeURIComponent(tag));
		const path = "/" + pathParts.join("/");

		const qs = new URLSearchParams();
		// Avoid cached image
		qs.set("ts", String(Date.now()));

		return API + path + "?" + qs.toString();
	}

	function setStatus(msg) {
		statusEl.textContent = msg || "";
	}

	function render() {
		const url = buildUrl();
		setStatus("Loading...");
		img.src = url;
	}

	// Events
	img.addEventListener("load", () => setStatus(""));
	img.addEventListener("error", () => setStatus("Failed to load image."));

	randomBtn.addEventListener("click", () => {
		const options = Array.from(tagSelect.options).map(o => o.value).filter(Boolean);
		tagSelect.value = pickRandom(options) || "";
		render();
	});

	[tagSelect].forEach(el => {
		const evt = el.tagName === "SELECT" ? "change" : "input";
		el.addEventListener(evt, render);
	});

	copyBtn.addEventListener("click", async () => {
		const link = buildUrl();
		try {
			await navigator.clipboard.writeText(link);
			setStatus("Link copied to clipboard.");
			setTimeout(() => setStatus(""), 1200);
		} catch {
			setStatus("Failed to copy link.");
		}
	});

	downloadBtn.addEventListener("click", async () => {
		const url = buildUrl();
		try {
			const res = await fetch(url);
			const blob = await res.blob();
			const a = document.createElement("a");
			a.href = URL.createObjectURL(blob);
			a.download = `cat.jpg`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(a.href);
		} catch {
			setStatus("Download failed.");
		}
	});

	themeToggle.addEventListener("click", toggleTheme);

	// Load tags from API
	async function loadTags() {
		try {
			const res = await fetch(API + "/api/tags");
			const tags = await res.json();
			if (Array.isArray(tags)) {
				for (const t of tags) {
					const opt = document.createElement("option");
					opt.value = t;
					opt.textContent = t;
					tagSelect.appendChild(opt);
				}
			}
		} catch {
			// ignore tag load errors; still usable
		}
	}

	// Initialize
	initTheme();
	loadTags().then(render);
	render();
})();
