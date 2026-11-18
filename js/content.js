// Contenido editable de la experiencia.
// Textos, rutas de imagen y coordenadas del mapa viven aquí, separados del código de navegación.
// Para cambiar un texto o reemplazar una imagen no hace falta tocar otros archivos.

export const CONTENT_VERSION = 'v1';

// URL de la app web de Google Apps Script (termina en /exec).
// Mientras esté vacía, la experiencia funciona y los envíos quedan "Pendiente de guardar".
export const API_URL = '';

export const TEXTS = {
  title: 'TEO El Nuevo Rumbo',
  intro:
    'Acompaña a TEO en una aventura que cambiará la forma de enfrentar los desafíos de su comunidad. Recorre seis momentos, descubre su historia y completa el reto final.',
  start: 'Comenzar aventura',
  mapHint: 'Haz clic en el siguiente momento para acompañar a TEO.',
  continue: 'Continuar recorrido',
  finalChallenge: 'Reto Final',
  challengeIntro:
    'Acompañaste a TEO en su travesía. Ahora descubre cuánto aprendiste sobre cómo enfrentar los desafíos en #ModoDrimer.',
  submit: 'Enviar respuestas',
  repeatStory: 'Repetir historia para mejorar',
  improve: 'Mejorar mi nota',
  retry: 'Volver a intentar',
  reviewStory: 'Revisar historia',
  backToMap: 'Volver al mapa',
  viewResult: 'Ver mi resultado',
  msg20:
    '¡Completaste la travesía de TEO! Obtuviste 20 de 20. Lleva el #ModoDrimer a tu trabajo: escucha a tu cliente, busca mejores formas de hacer las cosas, comprométete y enfócate en los resultados.',
  msg16: (best) =>
    `¡Completaste la travesía de TEO! Tu mejor nota es ${best} de 20. Ya aprobaste y puedes seguir aprendiendo para alcanzar 20.`,
  msgFailRetry: 'Aún no alcanzas los 16 puntos. Revisa lo aprendido y vuelve a intentarlo.',
  msgFailOut:
    'Terminaste tus tres oportunidades. Completa nuevamente la historia para habilitar tres oportunidades más.',
};

export const IMAGES = {
  logo: 'assets/img/logo_teo_elnuevorumbo.jpg',
  teo: 'assets/img/teo_corriendo.png',
  // Mapa base final que entregará Drimer. Si el archivo no existe se dibuja el mapa provisional.
  map: 'assets/img/mapa/mapa_base.png',
  // Logo #ModoDrimer para el momento 6 (opcional).
  modoDrimer: 'assets/img/logo_modo_drimer.png',
};

// Mapa: coordenadas en el sistema del viewBox (1600 x 1000).
// Si el mapa final tiene otra composición, solo hay que mover estos puntos y curvas.
export const MAP = {
  width: 1600,
  height: 1000,
  start: { x: 170, y: 890 },
  stops: [
    { x: 360, y: 700 },
    { x: 700, y: 800 },
    { x: 1010, y: 640 },
    { x: 700, y: 450 },
    { x: 1010, y: 260 },
    { x: 1380, y: 170 },
  ],
  // Tramo i: desde el punto anterior (inicio o parada i) hasta la parada i+1. Curvas SVG.
  segments: [
    'M170 890 C 230 820, 280 740, 360 700',
    'M360 700 C 450 660, 560 860, 700 800',
    'M700 800 C 830 745, 900 640, 1010 640',
    'M1010 640 C 1150 640, 1120 470, 980 455 C 880 445, 790 470, 700 450',
    'M700 450 C 560 420, 600 300, 760 285 C 860 275, 930 270, 1010 260',
    'M1010 260 C 1120 245, 1200 120, 1380 170',
  ],
};

const img = (id) => `assets/img/escenas/${id}.png`;

export const MOMENTS = [
  {
    n: 1,
    title: 'La forma de siempre',
    pages: [
      {
        id: 'm01_izq',
        heading: 'Una colonia en paz',
        image: img('m01_izq'),
        placeholder:
          'Panorámica de río, laguna, represa y hogares; Juancho guía a la comunidad, TEO participa entre los castores.',
        text: 'En un bosque, una comunidad de castores vivía junto a una laguna. Una represa de ramas y barro ayudaba a mantener el agua bajo control y sus hogares protegidos. Juancho guiaba a la colonia y enseñaba a todos a cuidarla. Entre los castores estaba TEO, siempre dispuesto a aprender y colaborar.',
      },
      {
        id: 'm01_der',
        heading: 'Lo que siempre ha funcionado',
        image: img('m01_der'),
        placeholder:
          'Juancho indica una reparación y TEO con la colonia coloca ramas y barro en la represa, bajo condiciones tranquilas.',
        text: 'Durante años, cada vez que aparecía un problema, los castores reforzaban la represa con más ramas y barro. Así habían superado muchas lluvias. TEO y toda la colonia aprendieron a confiar en esa respuesta: si el problema era más grande, solo tenían que reforzar más y trabajar más duro.',
      },
    ],
  },
  {
    n: 2,
    title: 'Cuando lo de siempre deja de funcionar',
    pages: [
      {
        id: 'm02_izq',
        heading: 'Una tormenta diferente',
        image: img('m02_izq'),
        placeholder:
          'Tormenta intensa, caudal entrando en laguna, agua acercándose a casas; comunidad preocupada.',
        text: 'Un día llegó una tormenta mucho más fuerte que las anteriores. El río llevó tanta agua a la laguna que entraba más de la que podía salir. El nivel comenzó a subir y se acercó a las casas. La colonia se apresuró a reforzar la represa, como siempre lo había hecho.',
      },
      {
        id: 'm02_der',
        heading: 'El error de TEO',
        image: img('m02_der'),
        placeholder:
          'TEO tapa salidas con ramas y barro, agua acumulada detrás inunda casas; contraste visual claro entre acción y consecuencia.',
        text: 'TEO se esforzó por tapar las salidas de agua con ramas y barro. Creía que así protegería a todos. Pero la lluvia continuaba y, con menos espacio para salir, el agua se acumuló todavía más. Algunas casas se inundaron. La respuesta que antes funcionaba ahora estaba empeorando el problema.',
      },
    ],
  },
  {
    n: 3,
    title: 'Entender antes de actuar',
    pages: [
      {
        id: 'm03_izq',
        heading: 'El cuestionamiento de TEO',
        image: img('m03_izq'),
        placeholder:
          'TEO detenido y confundido frente a represa reforzada y casas inundadas; colonia preocupada al fondo.',
        text: 'TEO miró la represa reforzada y las casas inundadas. No entendía qué había salido mal: había hecho lo que siempre le habían enseñado y había trabajado más que nunca. A su alrededor, las familias estaban preocupadas. Por primera vez, se preguntó si esforzarse más era suficiente o si necesitaban una respuesta diferente.',
      },
      {
        id: 'm03_der',
        heading: 'La pregunta de Juancho',
        image: img('m03_der'),
        placeholder:
          'Juancho al lado de TEO señala a las familias y sus hogares, ambos escuchan a miembros de la comunidad; represa al fondo.',
        text: 'Juancho lo ayudó a pensar: si ahora llegaba mucha más agua, ¿por qué seguían respondiendo igual? Antes de actuar, TEO debía entender quién era su cliente y qué necesitaba. En su caso, eran las familias que dependían de la represa. Ellas no necesitaban una represa más grande: necesitaban hogares seguros. Primero debía escucharlas y comprender cómo ayudarlas.',
      },
    ],
  },
  {
    n: 4,
    title: 'Una nueva forma de hacer las cosas',
    pages: [
      {
        id: 'm04_izq',
        heading: 'La idea de TEO',
        image: img('m04_izq'),
        placeholder:
          'TEO observa terreno y traza en barro una salida y canales que rodean casas hacia terreno desocupado; mirada decidida.',
        text: 'TEO observó el terreno y buscó innovar para resolver el problema. En vez de seguir tapando todas las salidas, podían abrir un paso controlado y guiar el agua por canales, lejos de las casas. Ya no se trataba de hacer más de lo mismo, sino de encontrar una nueva y mejor forma de proteger a la colonia.',
      },
      {
        id: 'm04_der',
        heading: 'El esfuerzo de todos',
        image: img('m04_der'),
        placeholder:
          'TEO coordina grupos que recuperan ramas, refuerzan salida y preparan canales; todos trabajando con propósito común.',
        text: 'TEO reconoció que su primera decisión no había ayudado y explicó la nueva idea. Luego se puso a trabajar junto a los demás: unos prepararon los canales y otros reforzaron sus bordes con las ramas disponibles. Toda la colonia se comprometió con la solución. TEO acompañó el trabajo y ayudó a que todos avanzaran hacia el mismo objetivo.',
      },
    ],
  },
  {
    n: 5,
    title: 'Un resultado que nos protege',
    pages: [
      {
        id: 'm05_izq',
        heading: 'Juntos lo consiguieron',
        image: img('m05_izq'),
        placeholder:
          'Agua fluye por canales alejados de viviendas, laguna baja, casas fuera de peligro; colonia comprueba resultado.',
        text: 'Cuando los canales estuvieron listos, abrieron el paso y el agua comenzó a circular lejos de las casas. El nivel de la laguna bajó y los hogares quedaron fuera de peligro. Esta vez, el éxito no se midió por cuántas ramas habían colocado, sino por el resultado alcanzado: proteger a las familias trabajando juntos hacia el mismo objetivo.',
      },
      {
        id: 'm05_der',
        heading: 'TEO se convierte en guía',
        image: img('m05_der'),
        placeholder:
          'Juancho reconoce a TEO frente a colonia junto a represa transformada, gesto de confianza y comunidad reunida.',
        text: 'Juancho reconoció que TEO había impulsado el cambio que ayudó a salvar a la colonia. Había aprendido de su error, entendido a las familias y guiado a todos hacia una solución mejor. Esos eran comportamientos que valía la pena seguir. Por eso le confió acompañar y guiar a la comunidad en sus próximos desafíos.',
      },
    ],
  },
  {
    n: 6,
    title: 'Nace el #ModoDrimer',
    center: true,
    pages: [
      {
        id: 'm06_centro',
        heading: 'Nace el #ModoDrimer',
        image: img('m06_centro'),
        placeholder:
          'TEO protagonista, Juancho y colonia detrás; paisaje recuperado, casas protegidas y canales funcionando; espacio para texto y marca cultural.',
        text: 'TEO descubrió que, cuando el entorno cambia, también debe cambiar nuestra forma de actuar: demostrar Compromiso, escuchar y comprender a nuestro cliente, buscar nuevas y mejores formas de hacer las cosas y enfocarnos en alcanzar nuestros resultados. A esa forma de enfrentar los desafíos la llamaron #ModoDrimer.',
        values: ['Compromiso', 'Orientación al Cliente', 'Innovación', 'Orientación a Resultados'],
      },
    ],
  },
];

// Preguntas del reto final. La clave también existe en el servidor (Apps Script),
// que recalcula la nota oficial a partir de las respuestas recibidas.
export const QUESTIONS = [
  {
    q: '¿Qué aprendió TEO cuando reforzar la represa hizo que el agua subiera más?',
    options: {
      A: 'Que debió colocar las ramas más rápido.',
      B: 'Que, cuando las condiciones cambian, debemos revisar si nuestra forma de actuar sigue funcionando.',
      C: 'Que la colonia debía esperar a que la tormenta terminara.',
    },
    answer: 'B',
    feedback:
      'Vivir el #ModoDrimer significa responder a los desafíos con Orientación al Cliente, Innovación, Compromiso y Orientación a Resultados. TEO aprendió que repetir lo de siempre no bastaba: debía entender la necesidad, buscar otra solución y trabajar con la colonia para proteger sus hogares.',
  },
  {
    q: '¿Qué comprendió TEO al escuchar a las familias junto a Juancho?',
    options: {
      A: 'Que necesitaban una represa más grande.',
      B: 'Que querían aprender a colocar ramas.',
      C: 'Que necesitaban hogares seguros y que su trabajo debía responder a esa necesidad.',
    },
    answer: 'C',
    feedback:
      'La Orientación al Cliente empieza por escuchar y entender qué necesita quien depende de nuestro trabajo. Las familias no necesitaban una represa más grande: necesitaban hogares seguros.',
  },
  {
    q: '¿Cómo demostró TEO que podía encontrar una mejor forma de resolver el problema?',
    options: {
      A: 'Propuso abrir un paso controlado y guiar el agua por canales lejos de las casas.',
      B: 'Pidió que todos siguieran reforzando la represa como siempre.',
      C: 'Decidió probar cualquier idea sin observar el terreno.',
    },
    answer: 'A',
    feedback:
      'La Innovación consiste en buscar nuevas y mejores formas de hacer las cosas. TEO observó el terreno y propuso redirigir el agua para resolver el problema que la solución de siempre ya no podía atender.',
  },
  {
    q: '¿Qué acción de TEO mostró su compromiso con la colonia?',
    options: {
      A: 'Explicar su idea y dejar que los demás se encargaran de todo.',
      B: 'Reconocer su error, trabajar junto a los demás y acompañarlos para alcanzar el objetivo.',
      C: 'Prometer que la solución funcionaría, aunque no participara en el trabajo.',
    },
    answer: 'B',
    feedback:
      'El Compromiso se demuestra con acciones. TEO asumió su responsabilidad, se puso a trabajar y acompañó a la colonia para llevar la solución a la práctica.',
  },
  {
    q: '¿Cómo supo la colonia que había conseguido el resultado que necesitaba?',
    options: {
      A: 'Porque todos habían trabajado durante muchas horas.',
      B: 'Porque habían utilizado todas las ramas disponibles.',
      C: 'Porque el agua bajó y las familias quedaron fuera de peligro.',
    },
    answer: 'C',
    feedback:
      'La Orientación a Resultados implica tener claro el objetivo y comprobar que lo alcanzamos. El éxito de la colonia se vio en los hogares seguros, no en la cantidad de ramas utilizadas ni en las horas trabajadas.',
  },
];

export const POINTS_PER_QUESTION = 4;
export const PASS_SCORE = 16;
export const MAX_SCORE = 20;
export const ATTEMPTS_PER_CYCLE = 3;
