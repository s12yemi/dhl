const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const languages = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' }
];

const translations = {
  en: {
    heroTitle: "Global Logistics. Delivered Faster.",
    heroSub: "Track your consignment, calculate shipping costs, and schedule global pickups with our premium Logistics Network.",
    trackPlaceholder: "Enter Consignment Number (e.g. DHL-419024091-IN)",
    trackBtn: "Track",
    rateCalc: "Rate Calculator",
    weight: "Weight (kg)",
    serviceType: "Service Type",
    length: "Length (cm)",
    width: "Width (cm)",
    height: "Height (cm)",
    estimateBtn: "Estimate Quote",
    marketingTitle: "Ship Globally with Confidence",
    marketingSub: "DHL is the global market leader in the logistics industry. We commit to delivering your products safely, on time, and across all borders. Register today to access our shipment creation tools and digital invoicing.",
    securedTitle: "100% Secured",
    securedSub: "Full cargo insurance on demand.",
    fastTransitTitle: "Fast Transit",
    fastTransitSub: "Next day priority flights.",
    navHome: "Home",
    navDashboard: "Dashboard",
    navBook: "Book Shipment",
    navLogin: "Login / Sign Up",
    navLogout: "Logout",
    dashboardTitle: "Customer Dashboard",
    dashboardSub: "Manage and track your active bookings.",
    bookBtn: "Book New Shipment",
    noShipments: "No shipments booked yet",
    noShipmentsSub: "Create your first consignment shipment quote right now."
  },
  de: {
    heroTitle: "Globale Logistik. Schneller geliefert.",
    heroSub: "Verfolgen Sie Ihre Sendung, berechnen Sie Versandkosten und planen Sie weltweite Abholungen mit unserem Premium-Logistiknetzwerk.",
    trackPlaceholder: "Sendungsnummer eingeben (z.B. DHL-419024091-IN)",
    trackBtn: "Verfolgen",
    rateCalc: "Tarifrechner",
    weight: "Gewicht (kg)",
    serviceType: "Serviceart",
    length: "Länge (cm)",
    width: "Breite (cm)",
    height: "Höhe (cm)",
    estimateBtn: "Angebot schätzen",
    marketingTitle: "Weltweit zuverlässig versenden",
    marketingSub: "DHL ist der weltweite Marktführer in der Logistikbranche. Wir verpflichten uns, Ihre Produkte sicher, pünktlich und über alle Grenzen hinweg zuzustellen. Registrieren Sie sich noch heute, um auf unsere Tools zur Sendungserstellung und die digitale Rechnungsstellung zuzugreifen.",
    securedTitle: "100% Gesichert",
    securedSub: "Volle Transportversicherung auf Anfrage.",
    fastTransitTitle: "Schneller Transport",
    fastTransitSub: "Prioritätsflüge am nächsten Tag.",
    navHome: "Startseite",
    navDashboard: "Dashboard",
    navBook: "Sendung buchen",
    navLogin: "Anmelden / Registrieren",
    navLogout: "Abmelden",
    dashboardTitle: "Kunden-Dashboard",
    dashboardSub: "Verwalten und verfolgen Sie Ihre aktiven Buchungen.",
    bookBtn: "Neue Sendung buchen",
    noShipments: "Noch keine Sendungen gebucht",
    noShipmentsSub: "Erstellen Sie jetzt Ihr erstes Angebot für eine Sendung."
  },
  es: {
    heroTitle: "Logística Global. Entregado Más Rápido.",
    heroSub: "Realice el seguimiento de su envío, calcule los costos de envío y programe recolecciones globales con nuestra red de logística premium.",
    trackPlaceholder: "Ingrese el número de envío (ej. DHL-419024091-IN)",
    trackBtn: "Buscar",
    rateCalc: "Calculadora de Tarifas",
    weight: "Peso (kg)",
    serviceType: "Tipo de Servicio",
    length: "Largo (cm)",
    width: "Ancho (cm)",
    height: "Alto (cm)",
    estimateBtn: "Cotizar Costo",
    marketingTitle: "Envíe a Nivel Mundial con Confianza",
    marketingSub: "DHL es el líder mundial en la industria de la logística. Nos comprometemos a entregar sus productos de manera segura, a tiempo y a través de todas las fronteras. Regístrese hoy para acceder a nuestras herramientas de creación de envíos y facturación digital.",
    securedTitle: "100% Asegurado",
    securedSub: "Seguro de carga completo bajo petición.",
    fastTransitTitle: "Tránsito Rápido",
    fastTransitSub: "Vuelos de prioridad al día siguiente.",
    navHome: "Inicio",
    navDashboard: "Panel",
    navBook: "Reservar Envío",
    navLogin: "Iniciar Sesión / Registrarse",
    navLogout: "Cerrar Sesión",
    dashboardTitle: "Panel del Cliente",
    dashboardSub: "Gestione y realice el seguimiento de sus reservas activas.",
    bookBtn: "Reservar Nuevo Envío",
    noShipments: "Aún no hay envíos reservados",
    noShipmentsSub: "Cree su primera cotización de envío en este momento."
  },
  fr: {
    heroTitle: "Logistique Mondiale. Livré plus rapidement.",
    heroSub: "Suivez votre envoi, calculez les frais d'expédition et planifiez des enlèvements mondiaux grâce à notre réseau logistique haut de gamme.",
    trackPlaceholder: "Saisir le numéro d'envoi (ex. DHL-419024091-IN)",
    trackBtn: "Suivre",
    rateCalc: "Calculateur de Tarifs",
    weight: "Poids (kg)",
    serviceType: "Type de Service",
    length: "Longueur (cm)",
    width: "Largeur (cm)",
    height: "Hauteur (cm)",
    estimateBtn: "Estimer le Tarif",
    marketingTitle: "Expédiez dans le monde entier en toute confiance",
    marketingSub: "DHL est le leader mondial du secteur de la logistique. Nous nous engageons à livrer vos produits en toute sécurité, à temps et à travers toutes les frontières. Inscrivez-vous dès aujourd'hui pour accéder à nos outils de création d'expéditions et de facturation numérique.",
    securedTitle: "100% Sécurisé",
    securedSub: "Assurance cargo complète sur demande.",
    fastTransitTitle: "Transit Rapide",
    fastTransitSub: "Vols prioritaires le lendemain.",
    navHome: "Accueil",
    navDashboard: "Tableau de bord",
    navBook: "Réserver un envoi",
    navLogin: "Connexion / Inscription",
    navLogout: "Déconnexion",
    dashboardTitle: "Tableau de Bord Client",
    dashboardSub: "Gérez et suivez vos réservations actives.",
    bookBtn: "Réserver un Nouvel Envoi",
    noShipments: "Aucun envoi réservé pour le moment",
    noShipmentsSub: "Créez votre premier devis d'expédition dès maintenant."
  }
};

app.get('/api/languages', (req, res) => {
  res.json(languages);
});

app.get('/api/translations/:lang', (req, res) => {
  const lang = req.params.lang;
  res.json(translations[lang] || translations.en);
});

app.listen(PORT, () => {
  console.log(`Language service running on port ${PORT}`);
});
