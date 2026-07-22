import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const categories = [
  "Architetti",
  "Avvocati",
  "Babysitter",
  "Barbieri",
  "Carpentieri",
  "Commercialisti",
  "Consulenti del lavoro",
  "Consulenti finanziari",
  "Dentisti",
  "Designer",
  "Dietisti",
  "Elettricisti",
  "Estetiste",
  "Falegnami",
  "Fisioterapisti",
  "Fotografi",
  "Geometri",
  "Giardinieri",
  "Grafici",
  "Idraulici",
  "Imbianchini",
  "Infermieri",
  "Informatici",
  "Insegnanti privati",
  "Installatori di climatizzatori",
  "Make-up artist",
  "Manutentori",
  "Massaggiatori",
  "Meccanici",
  "Mediatori immobiliari",
  "Montatori di mobili",
  "Muratori",
  "Nutrizionisti",
  "Parrucchieri",
  "Personal trainer",
  "Piastrellisti",
  "Psicologi",
  "Pulizie domestiche",
  "Riparatori di elettrodomestici",
  "Sarti",
  "Social media manager",
  "Tecnici informatici",
  "Traduttori",
  "Veterinari",
  "Videomaker",
  "Web designer",
];

const cities = [
  "Agrigento",
  "Aragona",
  "Canicattì",
  "Favara",
  "Licata",
  "Palma di Montechiaro",
  "Porto Empedocle",
  "Raffadali",
  "Ribera",
  "Sciacca",
  "Palermo",
  "Catania",
  "Messina",
  "Siracusa",
  "Ragusa",
  "Trapani",
  "Caltanissetta",
  "Enna",
  "Gela",
  "Marsala",
  "Mazara del Vallo",
  "Milano",
  "Roma",
  "Torino",
  "Napoli",
  "Bologna",
  "Firenze",
  "Bari",
  "Genova",
  "Verona",
];

const suggestedServices = [
  "Consulenza",
  "Sopralluogo",
  "Preventivo",
  "Assistenza",
  "Installazione",
  "Riparazione",
  "Manutenzione",
  "Intervento urgente",
  "Servizio a domicilio",
  "Servizio online",
];

const weekDays = [
  { key: "monday", label: "Lunedì" },
  { key: "tuesday", label: "Martedì" },
  { key: "wednesday", label: "Mercoledì" },
  { key: "thursday", label: "Giovedì" },
  { key: "friday", label: "Venerdì" },
  { key: "saturday", label: "Sabato" },
  { key: "sunday", label: "Domenica" },
] as const;

type DayKey = (typeof weekDays)[number]["key"];

type OpeningDay = {
  enabled: boolean;
  from: string;
  to: string;
};

type OpeningHours = Record<DayKey, OpeningDay>;

type ProfessionalProfile = {
  business_name: string | null;
  category: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  services: string[] | null;
  service_area: string[] | null;
  opening_hours: OpeningHours | null;
  logo_url: string | null;
  cover_url: string | null;
  gallery_urls: string[] | null;
  onboarding_step: number | null;
};

type StepOneForm = {
  businessName: string;
  category: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  description: string;
};

function createDefaultOpeningHours(): OpeningHours {
  return {
    monday: {
      enabled: true,
      from: "09:00",
      to: "18:00",
    },
    tuesday: {
      enabled: true,
      from: "09:00",
      to: "18:00",
    },
    wednesday: {
      enabled: true,
      from: "09:00",
      to: "18:00",
    },
    thursday: {
      enabled: true,
      from: "09:00",
      to: "18:00",
    },
    friday: {
      enabled: true,
      from: "09:00",
      to: "18:00",
    },
    saturday: {
      enabled: false,
      from: "09:00",
      to: "13:00",
    },
    sunday: {
      enabled: false,
      from: "09:00",
      to: "13:00",
    },
  };
}

function normalizeWebsite(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (
    trimmedValue.startsWith("http://") ||
    trimmedValue.startsWith("https://")
  ) {
    return trimmedValue;
  }

  return `https://${trimmedValue}`;
}
function createProfessionalSlug(
  businessName: string,
  category: string,
  city: string,
) {
  return `${businessName}-${category}-${city}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function OnboardingProfessionistaPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedStep = Number(searchParams.get("step") || "1");
  const currentStep =
    requestedStep >= 1 && requestedStep <= 4 ? requestedStep : 1;

  const [stepOneForm, setStepOneForm] = useState<StepOneForm>({
    businessName: "",
    category: "",
    city: "Agrigento",
    phone: "",
    email: "",
    website: "",
    description: "",
  });

  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [customService, setCustomService] = useState("");
  const [serviceArea, setServiceArea] = useState<string[]>(["Agrigento"]);

  const [openingHours, setOpeningHours] = useState<OpeningHours>(
    createDefaultOpeningHours(),
  );
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const userMetadata = useMemo(() => {
    return user?.user_metadata ?? {};
  }, [user]);

  function getFileExtension(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension) {
      return extension;
    }

    if (file.type === "image/png") {
      return "png";
    }

    if (file.type === "image/webp") {
      return "webp";
    }

    return "jpg";
  }

  function validateImage(file: File, maximumSizeMb: number) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return "Sono consentite soltanto immagini JPG, PNG o WEBP.";
    }

    const maximumSizeBytes = maximumSizeMb * 1024 * 1024;

    if (file.size > maximumSizeBytes) {
      return `L’immagine non può superare ${maximumSizeMb} MB.`;
    }

    return "";
  }

  async function uploadProfessionalImage(
    file: File,
    folder: "logo" | "cover" | "gallery",
  ) {
    if (!user) {
      throw new Error("Utente non autenticato.");
    }

    const extension = getFileExtension(file);
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const filePath = `${user.id}/${folder}/${uniqueName}`;

    const { error: uploadError } = await supabase.storage
      .from("professional-media")
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("professional-media")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || !user || logoUploading) {
      return;
    }

    const validationError = validateImage(file, 5);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setMessage("");
    setLogoUploading(true);

    try {
      const publicUrl = await uploadProfessionalImage(file, "logo");
      setLogoUrl(publicUrl);
      setMessage("Logo caricato correttamente.");
    } catch (uploadError) {
      console.error("Errore caricamento logo:", uploadError);
      setError("Non è stato possibile caricare il logo.");
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || !user || coverUploading) {
      return;
    }

    const validationError = validateImage(file, 8);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setMessage("");
    setCoverUploading(true);

    try {
      const publicUrl = await uploadProfessionalImage(file, "cover");
      setCoverUrl(publicUrl);
      setMessage("Copertina caricata correttamente.");
    } catch (uploadError) {
      console.error("Errore caricamento copertina:", uploadError);
      setError("Non è stato possibile caricare la copertina.");
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleGalleryChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    event.target.value = "";

    if (!files.length || !user || galleryUploading) {
      return;
    }

    const availablePlaces = 6 - galleryUrls.length;

    if (availablePlaces <= 0) {
      setError("Puoi caricare al massimo 6 immagini nella galleria.");
      return;
    }

    const selectedFiles = files.slice(0, availablePlaces);

    for (const file of selectedFiles) {
      const validationError = validateImage(file, 8);

      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setError("");
    setMessage("");
    setGalleryUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of selectedFiles) {
        const publicUrl = await uploadProfessionalImage(file, "gallery");
        uploadedUrls.push(publicUrl);
      }

      setGalleryUrls((current) => [...current, ...uploadedUrls]);
      setMessage("Immagini della galleria caricate correttamente.");
    } catch (uploadError) {
      console.error("Errore caricamento galleria:", uploadError);
      setError(
        "Non è stato possibile completare il caricamento della galleria.",
      );
    } finally {
      setGalleryUploading(false);
    }
  }

  function removeGalleryImage(imageUrl: string) {
    setGalleryUrls((current) =>
      current.filter((currentUrl) => currentUrl !== imageUrl),
    );

    setMessage("");
    setError("");
  }

  async function saveStepThree(event: FormEvent) {
    event.preventDefault();

    if (
      !user ||
      saving ||
      logoUploading ||
      coverUploading ||
      galleryUploading
    ) {
      return;
    }

    setError("");
    setMessage("");

    if (!logoUrl) {
      setError("Carica il logo o una foto rappresentativa dell’attività.");
      return;
    }

    setSaving(true);

    const { error: saveError } = await supabase
      .from("professional_profiles")
      .update({
        logo_url: logoUrl,
        image_url: logoUrl,
        cover_url: coverUrl || null,
        gallery_urls: galleryUrls,
        onboarding_step: 4,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (saveError) {
      console.error("Errore salvataggio Step 3:", saveError);
      setError("Non è stato possibile salvare le immagini. Riprova.");
      setSaving(false);
      return;
    }

    setSaving(false);
    setMessage("Immagini salvate correttamente.");

    window.setTimeout(() => {
      goToStep(4);
    }, 500);
  }

  async function startProfessionalSubscription() {
    if (!user || checkoutLoading) {
      return;
    }

    setError("");
    setMessage("");
    setCheckoutLoading(true);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "create-professional-subscription",
        {
          body: {},
        },
      );

      if (functionError) {
        throw functionError;
      }

      const checkoutUrl = data && typeof data.url === "string" ? data.url : "";

      if (!checkoutUrl) {
        throw new Error("URL del Checkout non disponibile.");
      }

      window.location.assign(checkoutUrl);
    } catch (checkoutError) {
      console.error("Errore avvio abbonamento professionale:", checkoutError);

      setError(
        checkoutError instanceof Error && checkoutError.message
          ? checkoutError.message
          : "Non è stato possibile aprire il Checkout Stripe. Riprova.",
      );

      setCheckoutLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setProfileLoading(false);
      return;
    }

    async function loadProfessionalProfile() {
      setProfileLoading(true);
      setError("");

      const { data, error: profileError } = await supabase
        .from("professional_profiles")
        .select(
          `
        business_name,
        category,
        city,
        phone,
        email,
        website,
        description,
        services,
        service_area,
        opening_hours,
        logo_url,
        cover_url,
        gallery_urls,
        onboarding_step
      `,
        )
        .eq("user_id", user!.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          "Errore caricamento profilo professionista:",
          profileError,
        );

        setError(
          "Non è stato possibile caricare i dati del profilo professionale.",
        );

        setProfileLoading(false);
        return;
      }

      const profile = data as ProfessionalProfile | null;

      setStepOneForm({
        businessName: profile?.business_name ?? userMetadata.full_name ?? "",
        category: profile?.category ?? "",
        city: profile?.city ?? "Agrigento",
        phone: profile?.phone ?? userMetadata.phone ?? "",
        email: profile?.email ?? user?.email ?? "",
        website: profile?.website ?? "",
        description: profile?.description ?? "",
      });

      setSelectedServices(profile?.services ?? []);

      setServiceArea(
        profile?.service_area?.length
          ? profile.service_area
          : [profile?.city ?? "Agrigento"],
      );

      setOpeningHours(
        profile?.opening_hours && typeof profile.opening_hours === "object"
          ? {
              ...createDefaultOpeningHours(),
              ...profile.opening_hours,
            }
          : createDefaultOpeningHours(),
      );
      setLogoUrl(profile?.logo_url ?? "");
      setCoverUrl(profile?.cover_url ?? "");
      setGalleryUrls(profile?.gallery_urls ?? []);

      const savedStep = profile?.onboarding_step ?? 1;
      const urlStep = Number(searchParams.get("step"));

      if (!urlStep && savedStep > 1) {
        setSearchParams({
          step: String(Math.min(savedStep, 4)),
        });
      }

      setProfileLoading(false);
    }

    void loadProfessionalProfile();
  }, [authLoading, searchParams, setSearchParams, user, userMetadata]);

  function updateStepOneField(field: keyof StepOneForm, value: string) {
    setStepOneForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setMessage("");
  }

  function goToStep(step: number) {
    setError("");
    setMessage("");
    setSearchParams({
      step: String(step),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveStepOne(event: FormEvent) {
    event.preventDefault();

    if (!user || saving) {
      return;
    }

    setError("");
    setMessage("");

    const businessName = stepOneForm.businessName.trim();

    const category = stepOneForm.category.trim();

    const city = stepOneForm.city.trim();

    const phone = stepOneForm.phone.trim();

    const email = stepOneForm.email.trim();

    const description = stepOneForm.description.trim();
    const baseSlug = createProfessionalSlug(
      businessName,
      category,
      city,
    );
    
    let slug = baseSlug;
    let suffix = 2;
    
    while (true) {
      const { data: existingProfile, error: slugCheckError } = await supabase
        .from("professional_profiles")
        .select("user_id")
        .eq("slug", slug)
        .neq("user_id", user.id)
        .maybeSingle();
    
      if (slugCheckError) {
        console.error("Errore controllo slug:", slugCheckError);
        setError("Non è stato possibile verificare l’indirizzo del profilo.");
        setSaving(false);
        return;
      }
    
      if (!existingProfile) {
        break;
      }
    
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    if (!businessName) {
      setError("Inserisci il nome della tua attività.");
      return;
    }

    if (!category) {
      setError("Seleziona una categoria professionale.");
      return;
    }

    if (!city) {
      setError("Seleziona la città in cui lavori.");
      return;
    }

    if (!phone) {
      setError("Inserisci un numero di telefono.");
      return;
    }

    if (!email) {
      setError("Inserisci un indirizzo email.");
      return;
    }

    if (!description) {
      setError("Inserisci una breve descrizione della tua attività.");
      return;
    }

    setSaving(true);

    const { error: saveError } = await supabase
      .from("professional_profiles")
      .upsert(
        {
          user_id: user.id,
          business_name: businessName,
          category,
          city,
          slug,
          phone,
          email,
          website: normalizeWebsite(stepOneForm.website),
          description,
          onboarding_step: 2,
          subscription_status: "inactive",
          is_published: false,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      );

    if (saveError) {
      console.error("Errore salvataggio Step 1:", saveError);

      setError("Non è stato possibile salvare le informazioni. Riprova.");

      setSaving(false);
      return;
    }

    setSaving(false);
    setMessage("Informazioni salvate correttamente.");

    window.setTimeout(() => {
      goToStep(2);
    }, 500);
  }

  function toggleService(service: string) {
    setSelectedServices((current) => {
      if (current.includes(service)) {
        return current.filter((item) => item !== service);
      }

      return [...current, service];
    });

    setError("");
    setMessage("");
  }

  function addCustomService() {
    const cleanService = customService.trim();

    if (!cleanService) {
      return;
    }

    setSelectedServices((current) => {
      const alreadyExists = current.some(
        (service) => service.toLowerCase() === cleanService.toLowerCase(),
      );

      if (alreadyExists) {
        return current;
      }

      return [...current, cleanService];
    });

    setCustomService("");
  }

  function toggleServiceArea(city: string) {
    setServiceArea((current) => {
      if (current.includes(city)) {
        return current.filter((item) => item !== city);
      }

      return [...current, city];
    });

    setError("");
    setMessage("");
  }

  function updateOpeningDay(day: DayKey, changes: Partial<OpeningDay>) {
    setOpeningHours((current) => ({
      ...current,
      [day]: {
        ...current[day],
        ...changes,
      },
    }));

    setError("");
    setMessage("");
  }

  async function saveStepTwo(event: FormEvent) {
    event.preventDefault();

    if (!user || saving) {
      return;
    }

    setError("");
    setMessage("");

    if (selectedServices.length === 0) {
      setError("Seleziona almeno un servizio offerto.");
      return;
    }

    if (serviceArea.length === 0) {
      setError("Seleziona almeno una zona servita.");
      return;
    }

    setSaving(true);

    const { error: saveError } = await supabase
      .from("professional_profiles")
      .update({
        services: selectedServices,
        service_area: serviceArea,
        opening_hours: openingHours,
        onboarding_step: 3,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (saveError) {
      console.error("Errore salvataggio Step 2:", saveError);

      setError(
        "Non è stato possibile salvare servizi e disponibilità. Riprova.",
      );

      setSaving(false);
      return;
    }

    setSaving(false);
    setMessage("Servizi e disponibilità salvati correttamente.");

    window.setTimeout(() => {
      goToStep(3);
    }, 500);
  }

  if (authLoading || profileLoading) {
    return (
      <>
        <Header />

        <main className="professional-wizard-page">
          <div className="professional-wizard-loading">
            <div className="professionals-loader" />
            <p>Caricamento del profilo...</p>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  if (!user) {
    return <Navigate to="/login?redirect=/onboarding-professionista" replace />;
  }

  return (
    <>
      <Header />

      <main className="professional-wizard-page">
        <section className="professional-wizard">
          <div className="container">
          <button

type="button"

className="professional-wizard__back"

onClick={() => navigate(-1)}

>

← Torna indietro

</button>

            <div className="professional-wizard__layout">
              <aside className="professional-wizard__sidebar">
                <span className="professional-wizard__badge">
                  Professionisti Verificati
                </span>

                <h1>Completa il tuo profilo professionale.</h1>

                <p>
                  Salviamo ogni passaggio, così potrai riprendere l’onboarding
                  anche in un secondo momento.
                </p>

                <div className="professional-wizard__steps">
                  <button
                    type="button"
                    className={`professional-wizard-step ${
                      currentStep === 1
                        ? "professional-wizard-step--active"
                        : currentStep > 1
                          ? "professional-wizard-step--completed"
                          : ""
                    }`}
                    onClick={() => goToStep(1)}
                  >
                    <span>{currentStep > 1 ? "✓" : "1"}</span>

                    <div>
                      <strong>Informazioni</strong>
                      <small>Attività e contatti</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`professional-wizard-step ${
                      currentStep === 2
                        ? "professional-wizard-step--active"
                        : currentStep > 2
                          ? "professional-wizard-step--completed"
                          : ""
                    }`}
                    onClick={() => {
                      if (currentStep >= 2) {
                        goToStep(2);
                      }
                    }}
                  >
                    <span>{currentStep > 2 ? "✓" : "2"}</span>

                    <div>
                      <strong>Servizi</strong>
                      <small>Cosa offri</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`professional-wizard-step ${
                      currentStep === 3
                        ? "professional-wizard-step--active"
                        : currentStep > 3
                          ? "professional-wizard-step--completed"
                          : ""
                    }`}
                    onClick={() => {
                      if (currentStep >= 3) {
                        goToStep(3);
                      }
                    }}
                  >
                    <span>{currentStep > 3 ? "✓" : "3"}</span>

                    <div>
                      <strong>Immagini</strong>
                      <small>Logo e foto</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`professional-wizard-step ${
                      currentStep === 4
                        ? "professional-wizard-step--active"
                        : ""
                    }`}
                    onClick={() => {
                      if (currentStep >= 4) {
                        goToStep(4);
                      }
                    }}
                  >
                    <span>4</span>

                    <div>
                      <strong>Abbonamento</strong>
                      <small>Attiva il profilo</small>
                    </div>
                  </button>
                </div>
              </aside>

              <section className="professional-wizard__card">
                {error && <div className="alert alert--error">{error}</div>}

                {message && (
                  <div className="alert alert--success">{message}</div>
                )}

                {currentStep === 1 && (
                  <>
                    <div className="professional-wizard__heading">
                      <span>Step 1 di 4</span>

                      <h2>Informazioni sulla tua attività</h2>

                      <p>
                        Questi dati saranno mostrati agli utenti che cercano
                        professionisti nella tua zona.
                      </p>
                    </div>

                    <form
                      className="professional-wizard__form"
                      onSubmit={saveStepOne}
                    >
                      <div className="professional-wizard__field professional-wizard__field--full">
                        <label htmlFor="businessName">Nome attività *</label>

                        <input
                          id="businessName"
                          type="text"
                          value={stepOneForm.businessName}
                          onChange={(event) =>
                            updateStepOneField(
                              "businessName",
                              event.target.value,
                            )
                          }
                          placeholder="Es. Idraulica Rossi"
                          disabled={saving}
                          required
                        />
                      </div>

                      <div className="professional-wizard__field">
                        <label htmlFor="category">Categoria *</label>

                        <select
                          id="category"
                          value={stepOneForm.category}
                          onChange={(event) =>
                            updateStepOneField("category", event.target.value)
                          }
                          disabled={saving}
                          required
                        >
                          <option value="">Seleziona una categoria</option>

                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="professional-wizard__field">
                        <label htmlFor="city">Città *</label>

                        <select
                          id="city"
                          value={stepOneForm.city}
                          onChange={(event) =>
                            updateStepOneField("city", event.target.value)
                          }
                          disabled={saving}
                          required
                        >
                          {cities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="professional-wizard__field">
                        <label htmlFor="phone">Telefono *</label>

                        <input
                          id="phone"
                          type="tel"
                          value={stepOneForm.phone}
                          onChange={(event) =>
                            updateStepOneField("phone", event.target.value)
                          }
                          disabled={saving}
                          required
                        />
                      </div>

                      <div className="professional-wizard__field">
                        <label htmlFor="email">Email professionale *</label>

                        <input
                          id="email"
                          type="email"
                          value={stepOneForm.email}
                          onChange={(event) =>
                            updateStepOneField("email", event.target.value)
                          }
                          disabled={saving}
                          required
                        />
                      </div>

                      <div className="professional-wizard__field professional-wizard__field--full">
                        <label htmlFor="website">Sito web</label>

                        <input
                          id="website"
                          type="text"
                          value={stepOneForm.website}
                          onChange={(event) =>
                            updateStepOneField("website", event.target.value)
                          }
                          placeholder="www.miosito.it"
                          disabled={saving}
                        />
                      </div>

                      <div className="professional-wizard__field professional-wizard__field--full">
                        <div className="professional-wizard__label-row">
                          <label htmlFor="description">
                            Descrizione attività *
                          </label>

                          <span>
                            {stepOneForm.description.length}
                            /1000
                          </span>
                        </div>

                        <textarea
                          id="description"
                          value={stepOneForm.description}
                          onChange={(event) =>
                            updateStepOneField(
                              "description",
                              event.target.value,
                            )
                          }
                          rows={6}
                          maxLength={1000}
                          disabled={saving}
                          required
                        />
                      </div>

                      <div className="professional-wizard__actions">
                        <Link
                          to="/diventa-professionista"
                          className="professional-wizard__secondary"
                        >
                          Annulla
                        </Link>

                        <button
                          type="submit"
                          className="professional-wizard__primary"
                          disabled={saving}
                        >
                          {saving ? "Salvataggio..." : "Salva e continua →"}
                        </button>
                      </div>
                    </form>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <div className="professional-wizard__heading">
                      <span>Step 2 di 4</span>

                      <h2>Servizi e zone coperte</h2>

                      <p>
                        Indica ciò che offri, dove lavori e in quali giorni sei
                        disponibile.
                      </p>
                    </div>

                    <form
                      className="professional-services-form"
                      onSubmit={saveStepTwo}
                    >
                      <div className="professional-services-section">
                        <div className="professional-services-section__heading">
                          <h3>Servizi offerti *</h3>

                          <p>
                            Seleziona tutte le opzioni pertinenti alla tua
                            attività.
                          </p>
                        </div>

                        <div className="professional-services-options">
                          {suggestedServices.map((service) => (
                            <button
                              key={service}
                              type="button"
                              className={`professional-service-chip ${
                                selectedServices.includes(service)
                                  ? "professional-service-chip--selected"
                                  : ""
                              }`}
                              onClick={() => toggleService(service)}
                              disabled={saving}
                            >
                              <span>
                                {selectedServices.includes(service) ? "✓" : "+"}
                              </span>

                              {service}
                            </button>
                          ))}
                        </div>

                        <div className="professional-custom-service">
                          <input
                            type="text"
                            value={customService}
                            onChange={(event) =>
                              setCustomService(event.target.value)
                            }
                            placeholder="Aggiungi un altro servizio"
                            disabled={saving}
                          />

                          <button
                            type="button"
                            onClick={addCustomService}
                            disabled={saving || !customService.trim()}
                          >
                            Aggiungi
                          </button>
                        </div>

                        {selectedServices.length > 0 && (
                          <div className="professional-selected-list">
                            <strong>Servizi selezionati:</strong>

                            <div>
                              {selectedServices.map((service) => (
                                <button
                                  key={service}
                                  type="button"
                                  onClick={() => toggleService(service)}
                                >
                                  {service} ×
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="professional-services-section">
                        <div className="professional-services-section__heading">
                          <h3>Zone servite *</h3>

                          <p>
                            Seleziona le città e i comuni nei quali sei
                            disponibile a lavorare.
                          </p>
                        </div>

                        <div className="professional-service-area-grid">
                          {cities.map((city) => (
                            <label
                              key={city}
                              className={`professional-area-option ${
                                serviceArea.includes(city)
                                  ? "professional-area-option--selected"
                                  : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={serviceArea.includes(city)}
                                onChange={() => toggleServiceArea(city)}
                                disabled={saving}
                              />

                              <span>{city}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="professional-services-section">
                        <div className="professional-services-section__heading">
                          <h3>Orari di disponibilità</h3>

                          <p>
                            Puoi modificare gli orari anche dopo la
                            pubblicazione del profilo.
                          </p>
                        </div>

                        <div className="professional-opening-hours">
                          {weekDays.map((day) => {
                            const dayValue = openingHours[day.key];

                            return (
                              <div
                                key={day.key}
                                className="professional-opening-day"
                              >
                                <label className="professional-opening-day__toggle">
                                  <input
                                    type="checkbox"
                                    checked={dayValue.enabled}
                                    onChange={(event) =>
                                      updateOpeningDay(day.key, {
                                        enabled: event.target.checked,
                                      })
                                    }
                                    disabled={saving}
                                  />

                                  <span>{day.label}</span>
                                </label>

                                <div className="professional-opening-day__times">
                                  <input
                                    type="time"
                                    value={dayValue.from}
                                    onChange={(event) =>
                                      updateOpeningDay(day.key, {
                                        from: event.target.value,
                                      })
                                    }
                                    disabled={saving || !dayValue.enabled}
                                  />

                                  <span>—</span>

                                  <input
                                    type="time"
                                    value={dayValue.to}
                                    onChange={(event) =>
                                      updateOpeningDay(day.key, {
                                        to: event.target.value,
                                      })
                                    }
                                    disabled={saving || !dayValue.enabled}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="professional-wizard__actions">
                        <button
                          type="button"
                          className="professional-wizard__secondary"
                          onClick={() => goToStep(1)}
                          disabled={saving}
                        >
                          ← Indietro
                        </button>

                        <button
                          type="submit"
                          className="professional-wizard__primary"
                          disabled={saving}
                        >
                          {saving ? "Salvataggio..." : "Salva e continua →"}
                        </button>
                      </div>
                    </form>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <div className="professional-wizard__heading">
                      <span>Step 3 di 4</span>

                      <h2>Immagini del profilo</h2>

                      <p>
                        Carica il logo, una copertina e alcune immagini che
                        mostrino la tua attività o i lavori realizzati.
                      </p>
                    </div>

                    <form
                      className="professional-media-form"
                      onSubmit={saveStepThree}
                    >
                      <section className="professional-media-section">
                        <div className="professional-media-section__heading">
                          <div>
                            <h3>Logo o immagine principale *</h3>
                            <p>
                              Verrà mostrata nelle card di ricerca e nel tuo
                              profilo. Formato consigliato: quadrato.
                            </p>
                          </div>

                          <span>Max 5 MB</span>
                        </div>

                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleLogoChange}
                          hidden
                        />

                        {logoUrl ? (
                          <div className="professional-logo-preview">
                            <img src={logoUrl} alt="Logo attività" />

                            <div>
                              <strong>Immagine principale caricata</strong>
                              <p>Puoi sostituirla cliccando sul pulsante.</p>

                              <button
                                type="button"
                                onClick={() => logoInputRef.current?.click()}
                                disabled={logoUploading || saving}
                              >
                                {logoUploading
                                  ? "Caricamento..."
                                  : "Sostituisci immagine"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="professional-media-upload"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={logoUploading || saving}
                          >
                            <span className="professional-media-upload__icon">
                              ＋
                            </span>

                            <strong>
                              {logoUploading
                                ? "Caricamento in corso..."
                                : "Carica logo o immagine principale"}
                            </strong>

                            <small>JPG, PNG o WEBP</small>
                          </button>
                        )}
                      </section>

                      <section className="professional-media-section">
                        <div className="professional-media-section__heading">
                          <div>
                            <h3>Immagine di copertina</h3>
                            <p>
                              Un’immagine orizzontale che rappresenti la tua
                              attività.
                            </p>
                          </div>

                          <span>Max 8 MB</span>
                        </div>

                        <input
                          ref={coverInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleCoverChange}
                          hidden
                        />

                        {coverUrl ? (
                          <div className="professional-cover-preview">
                            <img src={coverUrl} alt="Copertina attività" />

                            <div className="professional-cover-preview__actions">
                              <button
                                type="button"
                                onClick={() => coverInputRef.current?.click()}
                                disabled={coverUploading || saving}
                              >
                                {coverUploading
                                  ? "Caricamento..."
                                  : "Sostituisci copertina"}
                              </button>

                              <button
                                type="button"
                                onClick={() => setCoverUrl("")}
                                disabled={coverUploading || saving}
                              >
                                Rimuovi
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="professional-media-upload professional-media-upload--cover"
                            onClick={() => coverInputRef.current?.click()}
                            disabled={coverUploading || saving}
                          >
                            <span className="professional-media-upload__icon">
                              ▧
                            </span>

                            <strong>
                              {coverUploading
                                ? "Caricamento in corso..."
                                : "Carica immagine di copertina"}
                            </strong>

                            <small>Formato consigliato 16:9</small>
                          </button>
                        )}
                      </section>

                      <section className="professional-media-section">
                        <div className="professional-media-section__heading">
                          <div>
                            <h3>Galleria fotografica</h3>
                            <p>
                              Puoi caricare fino a 6 foto dei tuoi lavori, del
                              locale o dei servizi offerti.
                            </p>
                          </div>

                          <span>{galleryUrls.length}/6</span>
                        </div>

                        <input
                          ref={galleryInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          onChange={handleGalleryChange}
                          hidden
                        />

                        <div className="professional-gallery-grid">
                          {galleryUrls.map((imageUrl, index) => (
                            <div
                              key={`${imageUrl}-${index}`}
                              className="professional-gallery-item"
                            >
                              <img
                                src={imageUrl}
                                alt={`Immagine galleria ${index + 1}`}
                              />

                              <button
                                type="button"
                                onClick={() => removeGalleryImage(imageUrl)}
                                disabled={galleryUploading || saving}
                                aria-label={`Rimuovi immagine ${index + 1}`}
                              >
                                ×
                              </button>
                            </div>
                          ))}

                          {galleryUrls.length < 6 && (
                            <button
                              type="button"
                              className="professional-gallery-add"
                              onClick={() => galleryInputRef.current?.click()}
                              disabled={galleryUploading || saving}
                            >
                              <span>＋</span>

                              <strong>
                                {galleryUploading
                                  ? "Caricamento..."
                                  : "Aggiungi foto"}
                              </strong>
                            </button>
                          )}
                        </div>
                      </section>

                      <div className="professional-wizard__actions">
                        <button
                          type="button"
                          className="professional-wizard__secondary"
                          onClick={() => goToStep(2)}
                          disabled={
                            saving ||
                            logoUploading ||
                            coverUploading ||
                            galleryUploading
                          }
                        >
                          ← Indietro
                        </button>

                        <button
                          type="submit"
                          className="professional-wizard__primary"
                          disabled={
                            saving ||
                            logoUploading ||
                            coverUploading ||
                            galleryUploading
                          }
                        >
                          {saving ? "Salvataggio..." : "Salva e continua →"}
                        </button>
                      </div>
                    </form>
                  </>
                )}
                {currentStep === 4 && (
                  <>
                    <div className="professional-wizard__heading">
                      <span>Step 4 di 4</span>

                      <h2>Attiva il profilo professionale</h2>

                      <p>
                        Controlla l’anteprima e attiva il piano Professionista
                        Verificato da 25 € al mese.
                      </p>
                    </div>

                    {searchParams.get("checkout") === "cancelled" && (
                      <div className="professional-wizard__notice professional-wizard__notice--error">
                        Il pagamento è stato annullato. Puoi riprovare quando
                        vuoi.
                      </div>
                    )}

                    {searchParams.get("checkout") === "success" && (
                      <div className="professional-wizard__notice professional-wizard__notice--success">
                        Pagamento completato. Stiamo attivando il tuo profilo.
                      </div>
                    )}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "minmax(0, 1.35fr) minmax(280px, 0.65fr)",
                        gap: "24px",
                        alignItems: "start",
                      }}
                    >
                      <section
                        style={{
                          overflow: "hidden",
                          border: "1px solid #e5e7eb",
                          borderRadius: "24px",
                          background: "#ffffff",
                        }}
                      >
                        <div
                          style={{
                            minHeight: "210px",
                            background: coverUrl
                              ? `url(${coverUrl}) center / cover no-repeat`
                              : "linear-gradient(135deg, #dff5ea, #f5fbf8)",
                          }}
                        />

                        <div style={{ padding: "0 28px 30px" }}>
                          <div
                            style={{
                              width: "104px",
                              height: "104px",
                              marginTop: "-52px",
                              overflow: "hidden",
                              border: "5px solid #ffffff",
                              borderRadius: "24px",
                              background: "#eef7f2",
                              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
                            }}
                          >
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt={`Logo ${stepOneForm.businessName || "attività"}`}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : null}
                          </div>

                          <div style={{ marginTop: "18px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                padding: "6px 10px",
                                borderRadius: "999px",
                                background: "#e8f7ef",
                                color: "#16734a",
                                fontSize: "13px",
                                fontWeight: 700,
                              }}
                            >
                              Professionista verificato
                            </span>

                            <h3
                              style={{ margin: "14px 0 6px", fontSize: "28px" }}
                            >
                              {stepOneForm.businessName || "La tua attività"}
                            </h3>

                            <p style={{ margin: 0, color: "#64748b" }}>
                              {stepOneForm.category || "Categoria"} ·{" "}
                              {stepOneForm.city}
                            </p>
                          </div>

                          {stepOneForm.description && (
                            <p style={{ marginTop: "22px", lineHeight: 1.7 }}>
                              {stepOneForm.description}
                            </p>
                          )}

                          {selectedServices.length > 0 && (
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "8px",
                                marginTop: "22px",
                              }}
                            >
                              {selectedServices.map((service) => (
                                <span
                                  key={service}
                                  style={{
                                    padding: "8px 12px",
                                    borderRadius: "999px",
                                    background: "#f1f5f9",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                  }}
                                >
                                  {service}
                                </span>
                              ))}
                            </div>
                          )}

                          {galleryUrls.length > 0 && (
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(3, minmax(0, 1fr))",
                                gap: "10px",
                                marginTop: "26px",
                              }}
                            >
                              {galleryUrls.slice(0, 6).map((imageUrl) => (
                                <img
                                  key={imageUrl}
                                  src={imageUrl}
                                  alt="Galleria attività"
                                  style={{
                                    width: "100%",
                                    aspectRatio: "4 / 3",
                                    objectFit: "cover",
                                    borderRadius: "14px",
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </section>

                      <aside
                        style={{
                          padding: "26px",
                          border: "1px solid #dce9e2",
                          borderRadius: "24px",
                          background: "#f7fcf9",
                        }}
                      >
                        <span
                          style={{
                            color: "#16734a",
                            fontSize: "13px",
                            fontWeight: 800,
                            letterSpacing: ".04em",
                            textTransform: "uppercase",
                          }}
                        >
                          Piano mensile
                        </span>

                        <h3 style={{ margin: "10px 0 0", fontSize: "24px" }}>
                          Professionista Verificato
                        </h3>

                        <div style={{ margin: "18px 0 20px" }}>
                          <strong style={{ fontSize: "38px" }}>25 €</strong>
                          <span style={{ color: "#64748b" }}> / mese</span>
                        </div>

                        <div style={{ display: "grid", gap: "12px" }}>
                          <span>✓ Profilo professionale pubblicato</span>
                          <span>✓ Presenza nelle ricerche ELPYO</span>
                          <span>✓ Contatti diretti e galleria</span>
                        </div>

                        <button
                          type="button"
                          className="professional-wizard__primary"
                          onClick={startProfessionalSubscription}
                          disabled={checkoutLoading}
                          style={{ width: "100%", marginTop: "26px" }}
                        >
                          {checkoutLoading
                            ? "Apertura Checkout..."
                            : "Attiva il profilo"}
                        </button>

                        <p
                          style={{
                            margin: "14px 0 0",
                            color: "#64748b",
                            fontSize: "13px",
                            lineHeight: 1.5,
                            textAlign: "center",
                          }}
                        >
                          Pagamento sicuro gestito da Stripe. Abbonamento
                          mensile ricorrente.
                        </p>
                      </aside>
                    </div>

                    <div className="professional-wizard__actions">
                      <button
                        type="button"
                        className="professional-wizard__secondary"
                        onClick={() => goToStep(3)}
                        disabled={checkoutLoading}
                      >
                        ← Torna alle immagini
                      </button>
                    </div>
                  </>
                )}
              </section>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default OnboardingProfessionistaPage;
