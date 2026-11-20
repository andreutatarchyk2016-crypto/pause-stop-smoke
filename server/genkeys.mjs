import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("PUBLIC:", keys.publicKey);
console.log("PRIVATE:", keys.privateKey);
console.log("\nКлючи автоматически создаются при первом запуске сервера в server/data/vapid.json.");
