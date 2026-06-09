const API_URL = "https://api.brightdata.com/request";
const API_KEY = "1234567890";
const TARGET_URL = "https://www.google.com"; 

async function obtenerReels() {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                zone: "my_unlocker_zone", // Ajusta según tu configuración
                url: TARGET_URL,
                format: "json",
                method: "GET",
                country: "us",
                data_format: "json"
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Aquí puedes procesar y mostrar los reels en la página
        console.log("Reels recibidos:", data);

        // Ejemplo: podrías iterar sobre los resultados y mostrarlos en el HTML
        // (Dependerá de la estructura real de 'data')
    } catch (error) {
        console.error("Error obteniendo los reels:", error);
    }
}

// Llama a la función al cargar la página o donde lo necesites
obtenerReels();