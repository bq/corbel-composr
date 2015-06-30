if(!req.get("Authorization")){
	res.status(401).send(new ComposerError("error:authorization:undefined","",401));
	return
}

var result = {
	"library": [
		{
			"id": "e158d30801e729a4a970d19ba8c3ff7d",
			"titleText" : "A tres metros sobre el cielo",
			"publisherName" : "Grupo Planeta",
			"publicationDate" : "20100712",
			"numberOfPages" : "",
			"authors": [
				"Federico Moccia"
			],
			"topics": [{
					"id" : "YF",
					"name" : "Juvenil"
			},{
				"id" : "JHB",
				"name": "Sociología"
				}],
			"languages": [
				"spa"],
			"productIdentifier" : [
				{	"ProductIDType" : "ISBN",
				"IDValue" : "9788408095538"}
			],
			"productFormDetail" : [
				"EPUB",
				"reflowable"
			],
			"epubTechnicalProtection" : [
				"Adobe DRM"],
			"productSize" : "",
			"coverImageUrl" : "",
			"downloadUrl" : "",
			"descriptionText" : "Babi es una estudiante modelo y la hija perfecta. Step, en cambio, es violento y descarado. Provienen de dos mundos completamente distintos. A pesar de todo, entre los dos nacerá un amor más allá de todas las convenciones. Un amor controvertido por el que deberán luchar más de lo que esperaban. Babi y Step se erigen como un Romeo y Julieta contemporáneos en Roma, un escenario que parece creado para el amor",
			"owned" : "true"
		},
		{
			"id": "f44ee834b058d9f383acaece2d44613c",
			"titleText" : "Espejismo 1 (Wool 1). Holston",
			"publisherName" : "Grupo Planeta",
			"publicationDate" : "20130901",
			"numberOfPages" : "",
			"authors": [
				"Hugh Howey"
			],
			"topics": [{
					"id" : "YF",
					"name" : "Juvenil"
			},{
				"id" : "JHB",
				"name": "Sociología"
				}],
			"languages": [
				"spa"],
			"productIdentifier" : [
				{	"ProductIDType" : "ISBN",
				"IDValue" : "9788445001721"}
			],
			"productFormDetail" : [
				"EPUB",
				"reflowable"
			],
			"epubTechnicalProtection" : [
				"Adobe DRM"],
			"productSize" : "",
			"coverImageUrl" : "",
			"downloadUrl" : "",
			"descriptionText" : "Los últimos seres humanos viven en el silo, una prisión subterránea que ellos mismos han construido. Desde allí pueden ver el exterior, una imagen pixelada del mundo devastado y contaminado que han heredado de sus antepasados. Pero esta visión que ofrecen las cámaras del silo se va degradando poco a poco, cubierta por los vientos tóxicos que matarían en pocos minutos a cualquiera lo suficientemente loco para salir al exterior. Sólo hay un modo de que los habitantes del silo disfruten de una imagen clara del exterior: que envíen a alguien a la limpieza, la pena capital para todo aquel que quebrante las leyes del silo. Todos los condenados amenazan con no limpiar las cámaras pero todos acaban empleando sus últimos minutos de vida en llevar a cabo esta tarea. ¿Qué les empuja a hacerlo? El sheriff Holston siempre se ha hecho esa pregunta. Ahora está a punto de conocer la respuesta. El fenómeno:En 2011 la librería online Amazon vio cómo en su web nacía un nuevo fenómeno de ventas a la altura de Cincuenta sombras de Grey de E. L. James. Espejismo (cuyo título original es Wool) fue autopublicado por su autor, Hugh Howey, en formato electrónico y a los pocos meses había conseguido posicionarse entre los primeros puestos de las listas de más vendidos del New York Times y el USA Today. Ante las expectativas creadas y con el aval de un éxito de público y crítica sin precedentes, la editorial Simon & Schuster decidió hacerse con los derechos de publicación en papel y lanzaba el libro al mercado el pasado marzo.Espejismo fue publicado originalmente como cinco historias cortas; el éxito conseguido con el primero de los relatos fue lo que motivó a Howey a continuar desarrollando el mundo que había creado. Con la estrategia de la publicación por entregas, y gracias al efecto boca-oreja, Howey consiguió captar más seguidores con cada nueva publicación.Éste fue el inicio de Espejismo, un fenómeno que ha llegado a vender 500.000 eBooks en Amazon y que se publicará en dieciocho países. Los derechos cinematográficos del libro han sido adquiridos por Century Fox y la adaptación a la gran pantalla contará con la producción de Ridley Scott y con el guionista Steven Zaillian (responsable de obras como La lista de Schindler o Gangs of New York).",
			"owned" : "true"
		},
		{
			"id": "48eda201ae82b862679e3b30a4798e24",
			"titleText" : "Ficciones",
			"publisherName" : "Penguin Random House Grupo Editorial Espa&#xF1;a",
			"publicationDate" : "20120726",
			"numberOfPages" : "",
			"authors": [
				"Jorge Luis Borges"
			],
			"topics": [{
					"id" : "YF",
					"name" : "Juvenil"
			},{
				"id" : "JHB",
				"name": "Sociología"
				}],
			"languages": [
				"spa"],
			"productIdentifier" : [
				{	"ProductIDType" : "ISBN",
				"IDValue" : "9788499892641"}
			],
			"productFormDetail" : [
				"EPUB",
				"reflowable"
			],
			"epubTechnicalProtection" : [
				"Adobe DRM"],
			"productSize" : "",
			"coverImageUrl" : "",
			"downloadUrl" : "",
			"descriptionText" : "Pensé en un laberinto, en un sinuoso laberinto creciente que abarcara el pasado y el porvenir y que implicara de algún modo los astros.»<br><br><em>Ficciones </em>es quizá el libro más reconocido de Jorge Luis Borges.<br><br>Entre los cuentos que se reúnen aquí hay algunos de corte policial, como «La muerte y la brújula», otros sobre libros imaginarios, como «Tlön, Uqbar, Orbis Tertius», y muchos pertenecientes al género fantástico, como «Las ruinas circulares» o «El Sur», acaso su mejor relato, en palabras del mismo autor. Está compuesto por los libros <em>El jardín de senderos que se bifurcan </em>(1941) y <em>Artificios </em>(1944), considerados piezas fundamentales del universo borgeano.",
			"owned" : "true"
		},	
		{
			"id": "9979a1daf7c6eebf04375bd0fc37f3c3",
			"titleText" : "Gloria",
			"publisherName" : "Grupo Planeta - México",
			"publicationDate" : "20141015",
			"numberOfPages" : "",
			"authors": [
				"Sabina Berman"
			],
			"topics": [{
					"id" : "YF",
					"name" : "Juvenil"
			},{
				"id" : "JHB",
				"name": "Sociología"
				}],
			"languages": [
				"spa"],
			"productIdentifier" : [
				{	"ProductIDType" : "ISBN",
				"IDValue" : "9786070723889"}
			],
			"productFormDetail" : [
				"EPUB",
				"reflowable"
			],
			"epubTechnicalProtection" : [
				"Adobe DRM"],
			"productSize" : "",
			"coverImageUrl" : "",
			"downloadUrl" : "",
			"descriptionText" : "Este es el recuento de una aventura paradójica. Gloria Trevi, la diva de la música popular mexicana, protagonista del mayor y más confuso escándalo de la farándula en lo que va del siglo xxi, le pidió a Sabina Berman que investigara la verdad de lo que ocurrió, para que la escritora lo contara en el guión de una película. Al principio, la colaboración en esa búsqueda las acercó, sin embargo la verdad resultante terminaría por apartarlas. En esta época en que el máximo deseo es la Fama, el mayor peligro es la Infamia. Sabina Berman, autora de La mujer que buceó dentro del corazón del mundo (2011) y El dios de Darwin (2014), entrevistadora, dramaturga y guionista, ofrece en Gloria su testimonio y sus hallazgos al enfrentarse a uno de los casos criminales más controversiales y dramáticos, pero también al enigma de la relación entre el lenguaje y la realidad.",
			"owned" : "true"
		},
		{
			"id": "86807f2a007944d2692609a86494b490",
			"titleText" : "Padre rico. Padre pobre (Nueva edición actualizada). Qué les enseñan los ricos a sus hijos acerca del dinero",
			"publisherName" : "Penguin Random House Grupo Editorial México",
			"publicationDate" : "20120302",
			"numberOfPages" : "",
			"authors": [
				"Robert T. Kiyosaki"
			],
			"topics": [{
					"id" : "YF",
					"name" : "Juvenil"
			},{
				"id" : "JHB",
				"name": "Sociología"
				}],
			"languages": [
				"spa"],
			"productIdentifier" : [
				{	"ProductIDType" : "ISBN",
				"IDValue" : "9786071113177"}
			],
			"productFormDetail" : [
				"EPUB",
				"reflowable"
			],
			"epubTechnicalProtection" : [
				"Adobe DRM"],
			"productSize" : "",
			"coverImageUrl" : "",
			"downloadUrl" : "",
			"descriptionText" : "<p style=\"text-align:center\"><strong>El libro #1 de finanzas personales </strong></p><p>Una <strong>nueva edición revisada y actualizada del <em>bestseller</em> que revolucionó la forma de entender las finanzas personales.</strong> Las premisas que Robert Kiyosaki estableció en esta obra #primera de una serie de más de 50 títulos# han trascendido hasta hoy. Trece años después de su lanzamiento, sigue siendo <strong>el libro de finanzas personales más vendido.</strong><p> El autor y conferencista Robert Kiyosaki desarrolló una perspectiva económica única a partir de la exposición que tuvo a dos influencias: su  propio padre, altamente educado pero muy inestable y el padre multimillonario, sin educación universitaria, de su mejor amigo. Los problemas monetarios que su #Padre pobre# experimentó toda la vida (con cheques mensuales muy respetables pero nunca suficientes) rompían con lo que le comunicaba su #Padre rico#: que la clase pobre y la clase media trabajan por dinero pero la clase alta, hace que el dinero trabaje para ellos.</p><p> Con ese mensaje clavado en su mente, Kiyosaki logró retirarse a los 47 años. <em>Padre rico Padre pobre</em> presenta la filosofía detrás de esta relación excepcional con el dinero. Este libro aboga de manera convincente por el tipo de #conocimiento financiero# que nunca se enseña en las escuelas. Basado en el principio que los bienes que generan ingreso siempre dan mejores resultados que los mejores trabajos tradicionales, explica cómo pueden adquirirse dichos bienes para, eventualmente, olvidarse de trabajar.</p><p> </p><p>Robert T. Kiyosaki es un inversionista multimillonario, emprendedor, educador, conferencista y autor bestseller de la serie <em>Padre rico Padre pobre </em>. Después de retirarse, a los 47 años, fundó CHASFLOW Technologies y creó la Compañía de Rich Dad, que hoy en día ofrece a millones de personas en el mundo consejos para ser financieramente independientes. Robert ha escrito 16 libros que han vendido más de 27 millones de ejemplares en todo el planeta. Para más información, visita: <a href=\"http://www.richdad.com\">www.richdad.com</a></p>",
			"owned" : "true"
		},
		{
			"id": "8829e74bfdee5c6e1ee2d136208effb0",
			"titleText" : "Un regalo muy especial (Fixed Layout) (Sara y Ulises * Ulises y Sara 1)",
			"publisherName" : "Penguin Random House Grupo Editorial Espa&#xF1;a",
			"publicationDate" : "20130905",
			"numberOfPages" : "",
			"authors": [
				"Vanessa Cabrera",
				"Amaia Cia"
			],
			"topics": [{
					"id" : "YF",
					"name" : "Juvenil"
			},{
				"id" : "JHB",
				"name": "Sociología"
				}],
			"languages": [
				"spa"],
			"productIdentifier" : [
				{	"ProductIDType" : "ISBN",
				"IDValue" : "9788448836368"}
			],
			"productFormDetail" : [
				"EPUB",
				"Fixed format"
			],
			"epubTechnicalProtection" : [
				"Adobe DRM"],
			"productSize" : "",
			"coverImageUrl" : "",
			"downloadUrl" : "",
			"descriptionText" : "Sara esperaba un regalo especial por su cumpleaños, no todos los días se cumplen 5 años. Tiene que ser algo muy chulo, a lo mejor es un hermanito. Pero no es un hermanito, ni siquiera es algo enorme: es Ulises. Ulises esperaba encontrar una buena familia de osos. Con una mamá oso que cocine sopas calentitas y un montón de hermanos osos con los que jugar. Pero cuando abrió el paquete no había más osos: es Sara.<br><br>Formato Fixed Layout especial para tabletas.",
			"owned" : "true"
		},
		{
			"id": "c06a225e473e4f844f7b5a5eb0e9efbb",
			"titleText" : "Diario de las emociones (Edición especial tabletas)",
			"publisherName" : "Grupo Planeta",
			"publicationDate" : "20140605",
			"numberOfPages" : "",
			"authors": [
				"Anna Llenas"
			],
			"topics": [{
					"id" : "YF",
					"name" : "Juvenil"
			},{
				"id" : "JHB",
				"name": "Sociología"
				}],
			"languages": [
				"spa"],
			"productIdentifier" : [
				{	"ProductIDType" : "ISBN",
				"IDValue" : "9788449330216"}
			],
			"productFormDetail" : [
				"EPUB",
				"Fixed format"
			],
			"epubTechnicalProtection" : [
				"Adobe DRM"],
			"productSize" : "",
			"coverImageUrl" : "",
			"downloadUrl" : "",
			"descriptionText" : "¡Dibuja y escribe en tu tableta!. Edición digital especialmente producida para poder realizar los ejercicios en dispositivos electrónicos con pantalla táctil. ¿Qué sientes en este momento?Identificar lo que uno siente parece fácil pero, en realidad, no lo es tanto. Se nos ha enseñado a pensar, a actuar, a decidir, pero... ¿y a sentir?Este diario trata precisamente de eso. De que sientas tus emociones, las reconozcas y las expreses de una manera lúdica, práctica, divertida y creativa.Mediante una serie de ejercicios artísticos podrás dar rienda suelta a tu creatividad, canalizar tus emociones negativas y fomentar tus emociones positivas, logrando así un aumento del bienestar y un mayor conocimiento de ti mismo.Pero tranquilo, no hace falta saber dibujar.Tan solo necesitas tres cosas:- Una tableta- Ganas de experimentar y pasártelo bien.- Ganas de conocerte un poco más.",
			"owned" : "true"
		},
		{
			"id": "a3548fdafdfa6d5272d53e2454dc63d5",
			"titleText" : "Reilusionarse",
			"publisherName" : "Grupo Planeta",
			"publicationDate" : "20130205",
			"numberOfPages" : "",
			"authors": [
				"Luis Galindo"
			],
			"topics": [{
					"id" : "YF",
					"name" : "Juvenil"
			},{
				"id" : "JHB",
				"name": "Sociología"
				}],
			"languages": [
				"spa"],
			"productIdentifier" : [
				{	"ProductIDType" : "ISBN",
				"IDValue" : "9788415678137"}
			],
			"productFormDetail" : [
				"EPUB",
				"reflowable"
			],
			"epubTechnicalProtection" : [
				"Adobe DRM"],
			"productSize" : "",
			"coverImageUrl" : "",
			"downloadUrl" : "",
			"descriptionText" : "Los ocho capítulos de los que consta Reilusionarse te despiertan, te estimulan y te recuerdan que hay que vivir al cien por cien, que hay que tomar conciencia de que cada uno de nosotros elige la actitud con la que caminar por su vida. Luis Galindo condensa en este libro las enseñanzas del optimismo inteligente que han guiado sus cursos y conferencias en los últimos años: aprender del pasado, disfrutar del presente e ilusionarse por el futuro. A través de la reflexión, conmovedoras historias, consejos útiles y ejercicios prácticos, este libro nos conduce por la senda de la reilusión. Para lograrlo, el autor nos transmite la pasión que llena su vida, la ilusión por el trabajo bien hecho, el valor del ocio de calidad, la esperanza en el futuro, el valor del agradecimiento y del esfuerzo, y nos enseña a impregnar de disfrute y amor todo lo que hacemos. Un libro que te cambiará la vida, como se la ha cambiado ya a las personas cuyos testimoniales se incluyen en esta 10ª edición ampliada.",
			"owned" : "true"
		},
		{
			"id": "07aeab6b599b9941a7278036027d30ec",
			"titleText" : "¡Sí, quiero! (Edición enriquecida con material audiovisual)",
			"publisherName" : "Grupo Planeta",
			"publicationDate" : "20131220",
			"numberOfPages" : "",
			"authors": [
				"Bodas de Cuento"
			],
			"topics": [{
					"id" : "YF",
					"name" : "Juvenil"
			},{
				"id" : "JHB",
				"name": "Sociología"
				}],
			"languages": [
				"spa"],
			"productIdentifier" : [
				{	"ProductIDType" : "ISBN",
				"IDValue" : "9788408119470"}
			],
			"productFormDetail" : [
				"EPUB",
				"Fixed format"
			],
			"epubTechnicalProtection" : [
				"Adobe DRM"],
			"productSize" : "",
			"coverImageUrl" : "",
			"downloadUrl" : "",
			"descriptionText" : "Siempre se ha dicho que el día de tu boda es el más feliz de tu vida. Con ¡Sí, quiero!, el libro más esperado sobre cómo preparar y diseñar tu boda, no sólo será el más feliz, sino también el más especial, divertido, recordado y auténtico. En estas páginas encontrarás excelentes ideas para que todo en tu boda sea original y hable de ti: desde el diseño de las invitaciones hasta la luna de miel, desde la primera foto hasta el último trozo de tarta, desde el vestido de novia hasta el baile…, y siempre con un objetivo: que tus invitados y tú paséis un día inolvidable, porque una boda es una fiesta, la gran fiesta del amor.Esta edición enriquecida contiene vídeos donde podrás ver a los autores en acción: organizando los espacios, decorando las mesas, preparando los regalos para los invitados, etc. Además, encontrarás tutoriales interactivos que te darán ideas para que tu boda sea única, mágica e inolvidable.",
			"owned" : "true"
		},
		{
			"id": "7e39f85e19df300fc169f39002cdd9fb",
			"titleText" : "Aventura en Nueva York",
			"publisherName" : "Grupo Planeta",
			"publicationDate" : "20131220",
			"numberOfPages" : "",
			"authors": [
				"Tea Stilton"
			],
			"topics": [{
					"id" : "YF",
					"name" : "Juvenil"
			},{
				"id" : "JHB",
				"name": "Sociología"
				}],
			"languages": [
				"spa"],
			"productIdentifier" : [
				{	"ProductIDType" : "ISBN",
				"IDValue" : "9788408116431"}
			],
			"productFormDetail" : [
				"EPUB",
				"Fixed format"
			],
			"epubTechnicalProtection" : [
				"Adobe DRM"],
			"productSize" : "",
			"coverImageUrl" : "",
			"downloadUrl" : "",
			"descriptionText" : "Vive una aventura superratónica con las chicas del club de Tea ¡en Nueva York! En la ciudad de los rascacielos, las chicas del Club de Tea harán nuevos amigos. Nicky participará en la maratón de Nueva York y, además, deberán resolver un nuevo caso: ¿quién es el misterioso Fénix que amenaza a la familia de Pamela?",
			"owned" : "true"
		},
		{
			"id": "73333dedab4b5d4bf01c3033f31d78ea",
			"titleText" : "El secreto del castillo escocés",
			"publisherName" : "Grupo Planeta",
			"publicationDate" : "20130528",
			"numberOfPages" : "",
			"authors": [
				"Tea Stilton"
			],
			"topics": [{
					"id" : "YF",
					"name" : "Juvenil"
			},{
				"id" : "JHB",
				"name": "Sociología"
				}],
			"languages": [
				"spa"],
			"productIdentifier" : [
				{	"ProductIDType" : "ISBN",
				"IDValue" : "9788408116493"}
			],
			"productFormDetail" : [
				"EPUB",
				"Fixed format"
			],
			"epubTechnicalProtection" : [
				"Adobe DRM"],
			"productSize" : "",
			"coverImageUrl" : "",
			"downloadUrl" : "",
			"descriptionText" : "Un trepidante viaje por Escocia… ¡en moto! Las chicas del Club de Tea se dirigen a un antiguo castillo escocés, y allí tendrán que descubrir un misterioso secreto para salvar el edificio de una destrucción segura.",
			"owned" : "true"
		},
		{
			"id": "83268ea7e8bc034bf3708e2102098d7d",
			"titleText" : "Berlín De cerca 3",
			"publisherName" : "Grupo Planeta",
			"publicationDate" : "20131207",
			"numberOfPages" : "",
			"authors": [
				"Andrea Schulte-Peevers"
			],
			"topics": [{
					"id" : "YF",
					"name" : "Juvenil"
			},{
				"id" : "JHB",
				"name": "Sociología"
				}],
			"languages": [
				"spa"],
			"productIdentifier" : [
				{	"ProductIDType" : "ISBN",
				"IDValue" : "9788408123200"}
			],
			"productFormDetail" : [
				"EPUB",
				"Reflowable"
			],
			"epubTechnicalProtection" : [
				"Adobe DRM"],
			"productSize" : "",
			"coverImageUrl" : "",
			"downloadUrl" : "",
			"descriptionText" : "Una energía contagiosa impregna sus cafés, bares y clubes, y las boutiques alternativas y los restaurantes modernos rivalizan con museos de primer orden y con lugares emblemáticos que muestran la fascinante historia de la ciudad.Incluye:Información completa sobre: Reichstag, Unter den Linden, Isa de los Museos, Alexanderplatz, Potsdamer Platz, Scheunenviertel y alrededores, Kreuzberg, Friedrichshain, Prenzlauer Berg y KurfürstendammLos ebooks de Lonely Planet facilitan más que nunca la planificación antes y durante el viaje:· Tener a mano el mismo contenido que el de la edición impresa.· Descubrir experiencias únicas Magníficas fotografías de los principales puntos de interés y enlaces a las recomendaciones del autor ayudarán al viajero a seleccionar y planificar sus rutas.· Planificar el viaje perfecto Búsqueda por destino, marcadores de favoritos e inclusión de notas para personalizar la guía.· Información esencial en línea Los enlaces a las mejores webs aportan la información necesaria de cada lugar.· Enlaces a otras páginas y a los mapas· Navegación directa a los capítulos a través de índices· Los mapas y gráficos se pueden ampliar para facilitar su lectura",
			"owned" : "true"
		},
		{
			"id": "18f6e244a22fd84d423204f45034d25d",
			"titleText" : "Praga De cerca 3",
			"publisherName" : "Grupo Planeta",
			"publicationDate" : "20131205",
			"numberOfPages" : "",
			"authors": [
				"Bridget Gleeson"
			],
			"topics": [{
					"id" : "YF",
					"name" : "Juvenil"
			},{
				"id" : "JHB",
				"name": "Sociología"
				}],
			"languages": [
				"spa"],
			"productIdentifier" : [
				{	"ProductIDType" : "ISBN",
				"IDValue" : "9788408123439"}
			],
			"productFormDetail" : [
				"EPUB",
				"Reflowable"
			],
			"epubTechnicalProtection" : [
				"Adobe DRM"],
			"productSize" : "",
			"coverImageUrl" : "",
			"downloadUrl" : "",
			"descriptionText" : "Más de 20 años después de que la Revolución de Terciopelo abriese las puertas de este fascinante laberinto de callejones empedrados, Praga maravilla a los visitantes con su espectacular arquitectura gótica, diseños cubistas, pubssin pretensiones, cafeterías suntuosas, arte de vanguardia y un gran castillo que vigila la ciudad desde lo alto, creando un fabuloso paisaje de cuento de hadas.Información completa de las zonas: Castillo de Praga, Hradcany, Monte Petrin, Malá Strana, Museo Judío, Josefov, Plaza de la Ciudad Vieja, Staré Mesto, Plaza Wenceslao y alrededores, Nové Mesto, Vinohrady, Zizkov y HolesoviceLos ebooks de Lonely Planet facilitan más que nunca la planificación antes y durante el viaje:· Tener a mano el mismo contenido que el de la edición impresa.· Descubrir experiencias únicas Magníficas fotografías de los principales puntos de interés y enlaces a las recomendaciones del autor ayudarán al viajero a seleccionar y planificar sus rutas.· Planificar el viaje perfecto Búsqueda por destino, marcadores de favoritos e inclusión de notas para personalizar la guía.· Información esencial en línea Los enlaces a las mejores webs aportan la información necesaria de cada lugar.· Enlaces a otras páginas y a los mapas· Navegación directa a los capítulos a través de índices· Los mapas y gráficos se pueden ampliar para facilitar su lectura",
			"owned" : "true"
		},
		{
			"id": "20973782801eb6b749a034c8c2f731cf",
			"titleText" : "Milán y los Lagos De cerca 2",
			"publisherName" : "Grupo Planeta",
			"publicationDate" : "20131205",
			"numberOfPages" : "",
			"authors": [
				"Paula Hardy"
			],
			"topics": [{
					"id" : "YF",
					"name" : "Juvenil"
			},{
				"id" : "JHB",
				"name": "Sociología"
				}],
			"languages": [
				"spa"],
			"productIdentifier" : [
				{	"ProductIDType" : "ISBN",
				"IDValue" : "9788408123491"}
			],
			"productFormDetail" : [
				"EPUB",
				"Reflowable"
			],
			"epubTechnicalProtection" : [
				"Adobe DRM"],
			"productSize" : "",
			"coverImageUrl" : "",
			"downloadUrl" : "",
			"descriptionText" : "El viajero encontrará todo lo necesario para descubrir Milán y la región de los Lagos y disfrutar de cuanto tienen que ofrecer: los mejores itinerarios, restaurantes, lugares de ocio, mercados y mucho más.Incluye:Mapas de cada barrio y zonaItinerarios únicos y resumen de lo más destacado para sacarle todo el jugo a una corta visitaExpertos locales desvelan los secretos de la ciudadInformación completa sobre las zonas: Duomo, San Babila, Quadilatero d'Oro, Giardini Pubblici, Brera, Parco Sempione, Porta Garibaldi, Corso Magenta, Sant'Ambrogio, Navigli, Porta Romana y los Lagos Maggiore y Como y sus alrededoresLos ebooks de Lonely Planet facilitan más que nunca la planificación antes y durante el viaje:· Tener a mano el mismo contenido que el de la edición impresa.· Descubrir experiencias únicas Magníficas fotografías de los principales puntos de interés y enlaces a las recomendaciones del autor ayudarán al viajero a seleccionar y planificar sus rutas.· Planificar el viaje perfecto Búsqueda por destino, marcadores de favoritos e inclusión de notas para personalizar la guía.· Información esencial en línea Los enlaces a las mejores webs aportan la información necesaria de cada lugar.· Enlaces a otras páginas y a los mapas· Navegación directa a los capítulos a través de índices· Los mapas y gráficos se pueden ampliar para facilitar su lectura",
			"owned" : "true"
		},
		{
			"id": "0ece9e1e13a490d26bcf0b2df16c9f25",
			"titleText" : "Estoy bien",
			"publisherName" : "Grupo Planeta",
			"publicationDate" : "20140307",
			"numberOfPages" : "",
			"authors": [
				"J. J. Benítez"
			],
			"topics": [{
					"id" : "YF",
					"name" : "Juvenil"
			},{
				"id" : "JHB",
				"name": "Sociología"
				}],
			"languages": [
				"spa"],
			"productIdentifier" : [
				{	"ProductIDType" : "ISBN",
				"IDValue" : "9788408126997"}
			],
			"productFormDetail" : [
				"EPUB",
				"Reflowable"
			],
			"epubTechnicalProtection" : [
				"Adobe DRM"],
			"productSize" : "",
			"coverImageUrl" : "",
			"downloadUrl" : "",
			"descriptionText" : "Si creía conocer las investigaciones de J. J. Benítez, se equivoca. Estoy bien es otra vuelta de tuerca en la producción literaria del autor navarro.Veamos algunos pensamientos de Juanjo Benítez sobre el delicado asunto de los «resucitados»,como llama él a los muertos que han vuelto: «Estoy bien es tan increíble como cierto.»«Se trata de 160 casos “al sur de la razón”.»«Quizá este libro sea mucho más de lo que parece.»«Estoy bien debe ser leído despacio, muy despacio.»«El padre Azul (y su “gente”) se han sentado conmigo a la hora de escribirlo.»«Si usted tiene miedo a la muerte, éste es su libro; si no es así, con más razón.»«Algún día seremos esféricos.»«Al abrir Estoy bien, usted debería ver una luz.»«El concepto “vivo” necesita ser revisado.» ",
			"owned" : "true"
		},
		{
			"id": "7953951c047a5082aac4c099d538682a",
			"titleText" : "Edimburgo De cerca 2",
			"publisherName" : "Grupo Planeta",
			"publicationDate" : "20140612",
			"numberOfPages" : "",
			"authors": [
				"Neil Wilson"
			],
			"topics": [{
					"id" : "YF",
					"name" : "Juvenil"
			},{
				"id" : "JHB",
				"name": "Sociología"
				}],
			"languages": [
				"spa"],
			"productIdentifier" : [
				{	"ProductIDType" : "ISBN",
				"IDValue" : "9788408129172"}
			],
			"productFormDetail" : [
				"EPUB",
				"Reflowable"
			],
			"epubTechnicalProtection" : [
				"Adobe DRM"],
			"productSize" : "",
			"coverImageUrl" : "",
			"downloadUrl" : "",
			"descriptionText" : "Un sueño de mampostería y roca viva” encaramado sobre antiguos riscos, con una laberíntica Old Town que observa por encima de verdes jardines la elegancia georgiana de New Town. Historia y arquitectura se codean con una bacanal de bares, restaurantes y tiendas estilosas, todo ello envuelto en un paisaje urbano inmortalizado en el cine y la literatura.Incluye:Mapas de cada barrioItinerarios únicos y resumen de lo más destacado para sacarle todo el jugo a una corta visitaPrácticos consejos de viaje a cargo de un experto autorLos ebooks de Lonely Planet facilitan más que nunca la planificación antes y durante el viaje:· Tener a mano el mismo contenido que el de la edición impresa.· Descubrir experiencias únicas Magníficas fotografías de los principales puntos de interés y enlaces a las recomendaciones del autor ayudarán al viajero a seleccionar y planificar sus rutas.· Planificar el viaje perfecto Búsqueda por destino, marcadores de favoritos e inclusión de notas para personalizar la guía.· Información esencial en línea Los enlaces a las mejores webs aportan la información necesaria de cada lugar.· Enlaces a otras páginas y a los mapas· Navegación directa a los capítulos a través de índices· Los mapas y gráficos se pueden ampliar para facilitar su lectura",
			"owned" : "true"
		},
		{
			"id": "efe706a0eb986dec8c8259b41022b714",
			"titleText" : "Londres De cerca 4",
			"publisherName" : "Grupo Planeta",
			"publicationDate" : "20140603",
			"numberOfPages" : "",
			"authors": [
				"Emilie Filou"
			],
			"topics": [{
					"id" : "YF",
					"name" : "Juvenil"
			},{
				"id" : "JHB",
				"name": "Sociología"
				}],
			"languages": [
				"spa"],
			"productIdentifier" : [
				{	"ProductIDType" : "ISBN",
				"IDValue" : "9788408130789"}
			],
			"productFormDetail" : [
				"EPUB",
				"Reflowable"
			],
			"epubTechnicalProtection" : [
				"Adobe DRM"],
			"productSize" : "",
			"coverImageUrl" : "",
			"downloadUrl" : "",
			"descriptionText" : "Londres lo tiene todo: historia y cultura, arte y arquitectura. Su energía, su asombrosa diversidad y sus inigualables zonas verdes atraparán al visitante.Incluye:Detallados mapas en 3D de los principales monumentosInformación actualizada sobre los lugares imprescindibles de la ciudadAutores locales revelan las gemas ocultas de LondresExplorar Londres: Westminster Abbey, Westminster, National Gallery, Covent Garden, British Museum, Bloomsbury, St. Paul, la City, Tate Modern, South Bank, museos de Kensington, Regent's Park, Camden, Royal Observatoy y Greenwich. Los ebooks de Lonely Planet facilitan más que nunca la planificación antes y durante el viaje:· Tener a mano el mismo contenido que el de la edición impresa.· Descubrir experiencias únicas Magníficas fotografías de los principales puntos de interés y enlaces a las recomendaciones del autor ayudarán al viajero a seleccionar y planificar sus rutas.· Planificar el viaje perfecto Búsqueda por destino, marcadores de favoritos e inclusión de notas para personalizar la guía.· Información esencial en línea Los enlaces a las mejores webs aportan la información necesaria de cada lugar.· Enlaces a otras páginas y a los mapas· Navegación directa a los capítulos a través de índices· Los mapas y gráficos se pueden ampliar para facilitar su lectura ",
			"owned" : "true"
		},
		{
			"id": "d649557f9c24a6da19639251f7e6f471",
			"titleText" : "Camino de Santiago De cerca 1",
			"publisherName" : "Grupo Planeta",
			"publicationDate" : "20140703",
			"numberOfPages" : "",
			"authors": [
				"Edurne Baz Uriarte"
			],
			"topics": [{
					"id" : "YF",
					"name" : "Juvenil"
			},{
				"id" : "JHB",
				"name": "Sociología"
				}],
			"languages": [
				"spa"],
			"productIdentifier" : [
				{	"ProductIDType" : "ISBN",
				"IDValue" : "9788408132561"}
			],
			"productFormDetail" : [
				"EPUB",
				"Reflowable"
			],
			"epubTechnicalProtection" : [
				"Adobe DRM"],
			"productSize" : "",
			"coverImageUrl" : "",
			"downloadUrl" : "",
			"descriptionText" : "Información detallada sobre Pamplona, Logroño, Burgos, León, Ponferrada y Santiago de Compostela, así como reseñas de algunos lugares imprescindibles por donde el peregrino pasará a lo largo del Camino de Santiago.Incluye:Mapas de cada ciudad reseñada e itinerario del CaminoRutas únicas y resumen de lo más destacado para sacarle todo el jugo a la experienciaPrácticos consejos para recorrer el Camino a cargo de expertosLos ebooks de Lonely Planet facilitan más que nunca la planificación antes y durante el viaje:· Tener a mano el mismo contenido que el de la edición impresa.· Descubrir experiencias únicas Magníficas fotografías de los principales puntos de interés y enlaces a las recomendaciones del autor ayudarán al viajero a seleccionar y planificar sus rutas.· Planificar el viaje perfecto Búsqueda por destino, marcadores de favoritos e inclusión de notas para personalizar la guía.· Información esencial en línea Los enlaces a las mejores webs aportan la información necesaria de cada lugar.· Enlaces a otras páginas y a los mapas· Navegación directa a los capítulos a través de índices· Los mapas y gráficos se pueden ampliar para facilitar su lectura",
			"owned" : "true"
		},
		{
			"id": "37200e647f99558d81053ec379f9b02d",
			"titleText" : "Nueva York de cerca 5",
			"publisherName" : "Grupo Planeta",
			"publicationDate" : "20150128",
			"numberOfPages" : "",
			"authors": [
				"Cristian Bonetto"
			],
			"topics": [{
					"id" : "YF",
					"name" : "Juvenil"
			},{
				"id" : "JHB",
				"name": "Sociología"
				}],
			"languages": [
				"spa"],
			"productIdentifier" : [
				{	"ProductIDType" : "ISBN",
				"IDValue" : "9788408137092"}
			],
			"productFormDetail" : [
				"EPUB",
				"Reflowable"
			],
			"epubTechnicalProtection" : [
				"Adobe DRM"],
			"productSize" : "",
			"coverImageUrl" : "",
			"downloadUrl" : "",
			"descriptionText" : "Nueva York es el lugar donde los grandes pisan los escenarios de Broadway y cualquier puerta sin señalizar puede llevar a un antro asombroso. Nueva York no tiene parangón y con ayuda de esta guía, el viajero podrá descubrir lo mejor de la ciudad.Incluye:Selección de los puntos de interés imprescindibles.Apartados de vida local para descubrir la ciudad desde el punto de vista autóctono.Información sobre: SoHo y Chinatown, Lower Manhattan y Financial District, East Village y Lower East Side, Greenwich Village, Chelsea y Meatpacking District, Union Square, Flatiron District y Gramercy, Midtown, Upper East Side Upper West Side y Central Park.Los ebooks de Lonely Planet facilitan más que nunca la planificación antes y durante el viaje:· Tener a mano el mismo contenido que el de la edición impresa.· Descubrir experiencias únicas Magníficas fotografías de los principales puntos de interés y enlaces a las recomendaciones del autor ayudarán al viajero a seleccionar y planificar sus rutas.· Planificar el viaje perfecto Búsqueda por destino, marcadores de favoritos e inclusión de notas para personalizar la guía.· Información esencial en línea Los enlaces a las mejores webs aportan la información necesaria de cada lugar.· Enlaces a otras páginas y a los mapas· Navegación directa a los capítulos a través de índices· Los mapas y gráficos se pueden ampliar para facilitar su lectura",
			"owned" : "true"
		},
		{
			"id": "088262a760a6c993e807dcb63d71f23d",
			"titleText" : "Portugal 6",
			"publisherName" : "Grupo Planeta",
			"publicationDate" : "20141231",
			"numberOfPages" : "",
			"authors": [
				"Andy Symington",
				"Anja Mutic"
			],
			"topics": [{
					"id" : "YF",
					"name" : "Juvenil"
			},{
				"id" : "JHB",
				"name": "Sociología"
				}],
			"languages": [
				"spa"],
			"productIdentifier" : [
				{	"ProductIDType" : "ISBN",
				"IDValue" : "9788408138853"}
			],
			"productFormDetail" : [
				"EPUB",
				"Reflowable"
			],
			"epubTechnicalProtection" : [
				"Adobe DRM"],
			"productSize" : "",
			"coverImageUrl" : "",
			"downloadUrl" : "",
			"descriptionText" : "Portugal ofrece castillos encaramados a acantilados y ciudades encantadoras donde se mezcla lo medieval con lo moderno, y también fados estremecedores, fantástico marisco y playas maravillosas listas para ser descubiertas.Incluye:Capítulos especiales sobre actividades al aire libre, gastronomía, ruta de vinos del Douro y playas del Algarve.Además: fotos sugerentes, mapas claros, herramientas para planificar el viaje e información en profundidad.Información completa sobre: Lisboa y alrededores, el Algarve, el Alentejo, Extremadura y el Ribatejo, las Beiras, Oporto, el Douro y Trás-os-Montes y el Minho.Los ebooks de Lonely Planet facilitan más que nunca la planificación antes y durante el viaje:· Tener a mano el mismo contenido que el de la edición impresa.· Descubrir experiencias únicas Magníficas fotografías de los principales puntos de interés y enlaces a las recomendaciones del autor ayudarán al viajero a seleccionar y planificar sus rutas.· Planificar el viaje perfecto Búsqueda por destino, marcadores de favoritos e inclusión de notas para personalizar la guía.· Información esencial en línea Los enlaces a las mejores webs aportan la información necesaria de cada lugar.· Enlaces a otras páginas y a los mapas· Navegación directa a los capítulos a través de índices· Los mapas y gráficos se pueden ampliar para facilitar su lectura",
			"owned" : "true"
		},
	]
}

result.library = result.library.map(function(book){
	book.coverImageUrl = 'https://resources-qa.bqws.io/v1.0/resource/books:Book/' + book.id;
	book.downloadUrl = 'https://resources-qa.bqws.io/v1.0/resource/books:Book/' + book.id
	var date = book.publicationDate;
	var year = date.substring(0, 4);
	var month = parseInt(date.substring(4, 6)) - 1;
	var day = date.substring(6, 8);

	var dateObject = new Date(Date.UTC(year, month, day));

	book.publicationDate = dateObject.toISOString();
	return book;
});

res.send(result);