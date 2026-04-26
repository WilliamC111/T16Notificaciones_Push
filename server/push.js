
const fs = require('fs');
const urlsafeBase64 = require('urlsafe-base64');
const vapid = require('./vapid.json');

const webpush = require('web-push');

webpush.setVapidDetails(
    'mailto:william.cely05@uptc.edu.co',
    vapid.publicKey,
    vapid.privateKey
  );




let suscripciones = require('./subs-db.json');


module.exports.getKey = () => {
    return urlsafeBase64.decode( vapid.publicKey );
};



module.exports.addSubscription = ( suscripcion ) => {
    console.log('Antes enviar suscripción ');
    suscripciones.push( suscripcion );

    console.log('antes modificar subs-db.json');
    fs.writeFileSync(`${ __dirname }/subs-db.json`, JSON.stringify(suscripciones) );
    console.log('Nueva suscripción agregada');
};


module.exports.sendPush = ( post ) => {

    console.log('Mandando PUSHES');

    const notificacionesEnviadas = [];


    suscripciones.forEach( (suscripcion, i) => {


        const pushProm = webpush.sendNotification( suscripcion , JSON.stringify( post ) )
            .then( console.log( 'Notificacion enviada ') )
            .catch( err => {

                console.log('Notificación falló');

                if ( err.statusCode === 410 ) { // GONE, ya no existe
                    suscripciones[i].borrar = true;
                }

            });

        notificacionesEnviadas.push( pushProm );

    });

    Promise.all( notificacionesEnviadas ).then( () => {


        suscripciones = suscripciones.filter( subs => !subs.borrar );

        fs.writeFileSync(`${ __dirname }/subs-db.json`, JSON.stringify(suscripciones) );

    });

    // public/sw.js — Escuchar PUSH
self.addEventListener('push', e => {

    const data = JSON.parse(e.data.text());

    const title = data.titulo;

    const options = {
        // 1. Cuerpo del mensaje
        body: data.cuerpo,

        // 2. Ícono principal de la notificación
        icon: `img/avatars/${ data.usuario }.jpg`,

        // 3. Badge: ícono pequeño en la barra de estado (Android)
        badge: 'img/favicon.ico',

        // 4. Imagen grande dentro de la notificación
        image: 'https://vignette.wikia.nocookie.net/marvelcinematicuniverse/images/5/5b/Torre_de_los_Avengers.png',

        // 5. Patrón de vibración: [ms-vibra, ms-pausa, ms-vibra, ...]
        vibrate: [125, 75, 125, 275, 200, 275, 125, 75, 125],

        // 6. Etiqueta para agrupar notificaciones del mismo tipo
        tag: 'mensaje-' + data.usuario,

        // 7. Reemplaza notificaciones anteriores con el mismo tag
        renotify: true,

        // 8. Mantiene visible hasta que el usuario interactúe
        requireInteraction: true,

        // 9. Silencia el sonido del sistema
        silent: false,

        // 10. Timestamp personalizado (cuándo ocurrió el evento)
        timestamp: Date.now(),

        // 11. Datos adicionales accesibles en notificationclick
        data: {
            url: '/',
            usuario: data.usuario
        },

        // 12. Botones de acción
        actions: [
            {
                action: 'thor-action',
                title: '⚡ Thor',
                icon: 'img/avatars/thor.jpg'
            },
            {
                action: 'ironman-action',
                title: '🤖 Ironman',
                icon: 'img/avatars/ironman.jpg'
            }
        ]
    };

    e.waitUntil(
        self.registration.showNotification(title, options)
    );
});

}

