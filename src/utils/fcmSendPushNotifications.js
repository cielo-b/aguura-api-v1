const admin = require("firebase-admin");

const serviceAccount = require("../config/fcmPrivateKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://fantazy-85eac.firebaseio.com"
});


const sendPushNotification = async (token, title, body) => {
    try {
        const message = {
            notification: {
                title,
                body,
            },
            token
        };
        await admin.messaging().send(message)
            .then((response) => {
                console.log("Successfully Sent Message:", response);
                return response;
            }).catch((error) => {
                console.log("Error Eending Message:", error);
                return error;
            });

    } catch (error) {
        console.log(error);
        return error;
    }
};


module.exports = sendPushNotification;