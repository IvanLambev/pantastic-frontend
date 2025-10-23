// Bulgarian translations for the entire website
export const translations = {
  // Navigation
  nav: {
    home: "Начало",
    food: "Меню",
    deluxeBox: "Deluxe Box",
    about: "За нас",
    cart: "Количка",
    login: "Вход",
    logout: "Изход",
    signup: "Регистрация",
    admin: "Админ",
    dashboard: "Табло",
    orders: "Поръчки",
    profile: "Профил"
  },

  // Home Page
  home: {
    heroTitle: "Добре дошли в Pantastic",
    heroSubtitle: "Автентични български палачинки направени с любов",
    orderNow: "Поръчай сега",
    viewMenu: "Виж менюто",
    howItWorks: "Как работи",
    step1Title: "Избери",
    step1Desc: "Разгледай нашето меню и избери любимите си палачинки",
    step2Title: "Персонализирай",
    step2Desc: "Добави добавки и направи поръчката си уникална",
    step3Title: "Насладете се",
    step3Desc: "Вземи си поръчката или я получи доставена на вратата ти",
    restaurantSelected: "Избрахте ресторант: {name}",
    howItWorksTitle: "Как да поръчате вашите палачинки",
    howItWorksDesc: "Поръчването на палачинки никога не е било по-лесно. Просто разгледайте нашето меню, изберете любимите си артикули и ги добавете в количката си. След като сте готови, отидете на поръчка и изберете опцията за доставка или вземане. Ще получите горещи, пухкави палачинки за нула време — прясно от тигана и направени точно за вас.",
    browseMenuStep: "Разгледай менюто",
    browseMenuDesc: "Разгледайте нашата вкусна селекция от палачинки и добавки",
    addToCartStep: "Добави в количката",
    addToCartDesc: "Изберете любимите си и персонализирайте поръчката си",
    enjoyFreshStep: "Насладете се пресни",
    enjoyFreshDesc: "Получете горещи, пухкави палачинки доставени или ги вземете"
  },

  // Menu/Food Page
  menu: {
    title: "Нашето меню",
    subtitle: "Изберете от нашата селекция от вкусни палачинки",
    searchPlaceholder: "Търси палачинки...",
    noResults: "Не са намерени резултати",
    addToCart: "Добави в количката",
    viewDetails: "Виж детайли",
    customize: "Персонализирай",
    from: "от",
    loading: "Зареждане...",
    error: "Грешка при зареждане на менюто",
    selectRestaurant: "Моля, изберете ресторант първо",
    category: "Категория",
    allCategories: "Всички категории",
    changeRestaurant: "Промени ресторант",
    sweetPancakes: "Сладки палачинки",
    sweet: "Сладки",
    sourPancakes: "Солени палачинки",
    sour: "Солени",
    promo: "Промо",
    search: "Търсене",
    options: "Добавки",
    add: "Добави",
    priceRange: "Ценови диапазон",
    extrasAvailable: "Налични екстри",
    customizable: "Персонализируемо"
  },

  // Cart
  cart: {
    title: "Вашата количка",
    empty: "Вашата количка е празна",
    emptyDesc: "Добавете артикули от менюто, за да започнете поръчка",
    continueShopping: "Продължи с пазаруването",
    subtotal: "Междинна сума",
    deliveryFee: "Такса доставка",
    discount: "Отстъпка",
    total: "Общо",
    checkout: "Поръчай",
    remove: "Премахни",
    quantity: "Количество",
    addons: "Добавки",
    removables: "Премахнати",
    specialInstructions: "Специални инструкции",
    editInstructions: "Редактирай инструкции",
    removedFromCart: "Премахнато {name} от количката",
    orderCancelledSuccess: "Поръчката е отказана успешно",
    failedToCancelOrder: "Неуспешно отказване на поръчката",
    deliveryInformation: "Информация за доставка",
    pickupInformation: "Информация за вземане",
    restaurant: "Ресторант",
    deliveryAddressLabel: "Адрес за доставка",
    pickupFrom: "Вземане от",
    editAddress: "Редактирай адрес",
    basePrice: "Основна цена",
    orderSummary: "Обобщение на поръчката",
    addonsSelected: "добавки избрани",
    cancelOrder: "Отказ на поръчка"
  },

  // Checkout
  checkout: {
    title: "Поръчка",
    subtitle: "Завършете поръчката си",
    completeOrder: "Завършете поръчката си",
    accountRequired: "Изисква се акаунт",
    accountRequiredDesc: "Влезте или създайте акаунт, за да завършите поръчката си",
    signIn: "Вход",
    signUp: "Регистрация",
    or: "Или",
    createAccountCheckout: "Създай акаунт и поръчай",
    createAccountAndCheckout: "Създай акаунт и поръчай",
    back: "Назад",
    createAccountContinue: "Създай акаунт и продължи",
    creatingAccount: "Създаване на акаунт...",
    
    // Guest form
    firstName: "Име",
    lastName: "Фамилия",
    email: "Имейл",
    phone: "Телефон",
    city: "Град",
    password: "Парола",
    phoneFormat: "Формат: +359888000000",
    passwordMin: "Минимум 8 символа",
    allFieldsRequired: "Всички полета са задължителни",
    
    // Guest form placeholders
    guest: {
      firstNamePlaceholder: "Иван",
      lastNamePlaceholder: "Иванов", 
      emailPlaceholder: "name@example.com",
      phonePlaceholder: "+359888000000",
      phoneFormat: "Формат: +359888000000",
      cityPlaceholder: "София",
      passwordPlaceholder: "Създайте силна парола",
      passwordHint: "Минимум 8 символа"
    },
    
    // Discount
    discountCode: "Код за отстъпка",
    discountCodeDesc: "Имате промоционален код? Приложете го тук",
    enterCode: "Въведете код за отстъпка",
    enterDiscountCode: "Въведете код за отстъпка",
    enterDiscountCodeError: "Моля, въведете код за отстъпка",
    apply: "Приложи",
    checking: "Проверка...",
    remove: "Премахни",
    
    // Payment
    paymentMethod: "Начин на плащане",
    paymentMethodDesc: "Изберете как искате да платите за поръчката си",
    creditCard: "Кредитна/Дебитна карта",
    creditCardDesc: "Платете с вашата кредитна или дебитна карта",
    cash: "В брой при доставка/вземане",
    cashDesc: "Платете в брой когато пристигне поръчката ви",
    available: "Налично",
    
    payment: {
      card: "Кредитна/Дебитна карта",
      cardDesc: "Платете с вашата кредитна или дебитна карта",
      cash: "В брой при доставка/вземане",
      cashDesc: "Платете в брой когато пристигне поръчката ви"
    },
    
    // Delivery info
    deliveryAddress: "Адрес за доставка",
    deliveryTo: "Доставка до този адрес",
    deliveryToAddress: "Доставка до този адрес",
    edit: "Редактирай",
    pickupLocation: "Място за вземане",
    
    // Scheduling
    scheduleDelivery: "Планирай доставка",
    scheduleDesc: "Искате да получите поръчката си по-късно?",
    scheduleOrder: "Планирай поръчка",
    selectDate: "Избери дата",
    selectTime: "Избери час",
    time: "Час",
    scheduleNote1: "Можете да планирате поръчки до 3 дни предварително",
    scheduleNote2: "Налични часове: 08:00 - 22:30",
    scheduleNote3: "Часовете са на 30-минутни интервали",
    
    // Order timing
    orderTiming: "Време за поръчка",
    orderTimingDesc: "Планирайте поръчката си за определено време (по желание)",
    scheduleForLater: "Планирай за по-късно",
    
    // Order summary
    orderSummary: "Обобщение на поръчката",
    reviewOrder: "Прегледай поръчка",
    restaurantClosed: "Ресторантът е затворен",
    restaurantClosedMsg: "Ресторантът в момента е затворен",
    nextOpening: "Следващо отваряне",
    processingPayment: "Обработка на плащане...",
    
    // Order confirmation
    confirmOrder: "Потвърди поръчка",
    orderItems: "Артикули от поръчката",
    restaurantDetails: "Детайли за ресторанта",
    estimatedTime: "Очаквано време за {method}: {time}",
    deliveryLocation: "Място за доставка",
    pickupFromRestaurant: "Вземане от ресторант",
    arriveAtEstimatedTime: "Моля, пристигнете в очакваното време, за да получите поръчката си",
    cashOn: "В брой при {method}",
    backToCart: "Обратно към количката",
    placingOrder: "Обработваме поръчката...",
    pickupInformation: "Информация за вземане",
    
    // Errors
    pleaseSignIn: "Моля, влезте или създайте акаунт, за да продължите"
  },

  // Order Tracking
  tracking: {
    title: "Проследяване на поръчка",
    orderId: "Номер на поръчка",
    status: "Статус",
    estimatedTime: "Очаквано време",
    trackingNumber: "Номер за проследяване",
    paymentStatus: "Статус на плащането",
    
    // Statuses
    pending: "В изчакване",
    confirmed: "Потвърдена",
    preparing: "Подготвя се",
    ready: "Готова",
    onTheWay: "В движение",
    delivered: "Доставена",
    cancelled: "Отказана",
    
    // Payment statuses
    paid: "Платено",
    unpaid: "Неплатено",
    refunded: "Възстановено",
    
    // Delivery method
    delivery: "Доставка",
    pickup: "Вземане",
    
    // Steps
    orderPlaced: "Поръчката е направена",
    orderConfirmed: "Поръчката е потвърдена",
    preparingOrder: "Подготвяме поръчката ви",
    readyForPickup: "Готова за вземане",
    outForDelivery: "Излязла за доставка",
    orderDelivered: "Поръчката е доставена",
    
    // Messages
    orderReceived: "Вашата поръчка е получена",
    restaurantConfirmed: "Ресторантът потвърди вашата поръчка",
    chefPreparing: "Нашият готвач подготвя вашата поръчка",
    readyMessage: "Вашата поръчка е готова за вземане",
    driverOnWay: "Шофьорът е на път към вас",
    enjoyMeal: "Насладете се на храната си!",
    
    loading: "Зареждане на информация за поръчката...",
    error: "Грешка при зареждане на поръчката",
    notFound: "Поръчката не е намерена",
    backToHome: "Обратно към начало"
  },

  // Restaurant Selector
  restaurantSelector: {
    howToGetFood: "Как бихте искали да получите храната си?",
    pickup: "Вземане",
    pickupDesc: "Вземете поръчката си от ресторанта",
    delivery: "Доставка",
    deliveryDesc: "Доставка до вашата врата",
    
    whereLocated: "Къде се намирате?",
    whereDeliver: "Къде да доставим?",
    searchAddress: "Търсете адрес или кликнете на картата, за да изберете местоположението си",
    useCurrentLocation: "Използвай текущото ми местоположение",
    
    selectCity: "Изберете град",
    selectRestaurant: "Изберете ресторант в",
    changeCity: "Промени град",
    backToAddress: "Обратно към адрес",
    
    open: "Отворено",
    closed: "Затворено",
    opensAt: "Отваря в",
    closesAt: "Затваря в",
    
    distanceWarning: "Предупреждение за разстояние",
    distanceMessage: "Най-близкият работещ ресторант е на {distance} км от вашето местоположение.",
    distanceQuestion: "Поради разстоянието, таксите за доставка може да бъдат по-високи от обичайното. Искате ли да продължите с този ресторант?",
    yesSelect: "Да, изберете този ресторант",
    tryDifferent: "Опитайте друго местоположение",
    
    noRestaurantsOpen: "В момента няма отворени ресторанти",
    noRestaurantsOpenDesc: "Няма отворени ресторанти за поръчка в момента, но можете да разгледате менюто на най-близкия ресторант.",
    nearestRestaurant: "Най-близък ресторант",
    browseMenu: "Разгледай менюто",
    away: "разстояние",
    
    or: "Или",
    manuallySelect: "Избери ръчно ресторант",
    mapHint: "Използвайте два пръста за движение на картата"
  },

  // FAQ
  faq: {
    title: "Често задавани въпроси",
    question1: "Предлагате ли вегански или безглутенови палачинки?",
    answer1: "Да, имаме както вегански, така и безглутенови опции, ясно маркирани в менюто.",
    question2: "Мога ли да планирам поръчка предварително?",
    answer2: "Да, по време на поръчка можете да изберете предпочитано време за доставка или вземане.",
    question3: "Какви методи на плащане приемате?",
    answer3: "Приемаме кредитни карти, Apple Pay, Google Pay и в брой при вземане.",
    question4: "Как мога да се свържа с поддръжката?",
    answer4: "Може да се свържете с нас чрез имейл на support@pantastic.com или като ни се обадите директно."
  },

  // Delivery & Pickup Info
  delivery: {
    title: "Информация за доставка и вземане",
    description: "Предлагаме както опции за доставка, така и за вземане за всички поръчки. Доставката е налична всеки ден между 8 ч. сутринта и 4 ч. следобед в рамките на градските граници. Поръчките обикновено пристигат в рамките на 30-45 минути. Ако предпочитате да вземете поръчката си, просто изберете 'Вземане' при поръчка и се спрете на нашето място в планираното от вас време. Всички опаковки са екологични и предназначени да поддържат палачинките ви горещи.",
    deliveryService: "Услуга за доставка",
    pickupOption: "Опция за вземане",
    daily: "Ежедневно: 8 ч. - 16 ч.",
    withinCityLimits: "В рамките на градските граници",
    deliveryTime: "30-45 минути време за доставка",
    schedulePickup: "Планирайте вашето време за вземане",
    ecoFriendly: "Екологични опаковки",
    keepsPancakesHot: "Поддържа палачинките горещи"
  },

  // Login
  login: {
    title: "Вход в Pantastic",
    subtitle: "Въведете вашите данни за достъп до вашия акаунт",
    emailLabel: "Имейл",
    emailPlaceholder: "name@example.com",
    passwordLabel: "Парола",
    passwordPlaceholder: "Въведете вашата парола",
    forgotPassword: "Забравена парола?",
    loginButton: "Вход",
    loggingIn: "Влизане...",
    noAccount: "Нямате акаунт?",
    signUpLink: "Регистрирайте се",
    errors: {
      emailRequired: "Имейлът е задължителен",
      passwordRequired: "Паролата е задължителна",
      invalidCredentials: "Невалидни данни",
      serverError: "Грешка на сървъра. Моля, опитайте отново."
    }
  },

  // Sign Up
  signup: {
    title: "Регистрация в Pantastic",
    subtitle: "Създайте вашия акаунт, за да започнете",
    firstNameLabel: "Име",
    firstNamePlaceholder: "Иван",
    lastNameLabel: "Фамилия",
    lastNamePlaceholder: "Иванов",
    emailLabel: "Имейл",
    emailPlaceholder: "name@example.com",
    phoneLabel: "Телефон",
    phonePlaceholder: "+359888000000",
    phoneHelper: "Формат: +359888000000",
    cityLabel: "Град",
    cityPlaceholder: "София",
    passwordLabel: "Парола",
    passwordPlaceholder: "Създайте силна парола",
    passwordHelper: "Минимум 8 символа",
    signUpButton: "Регистрация",
    signingUp: "Регистриране...",
    haveAccount: "Вече имате акаунт?",
    signInLink: "Влезте",
    errors: {
      allFieldsRequired: "Всички полета са задължителни",
      invalidEmail: "Моля, въведете валиден имейл адрес",
      invalidPhone: "Телефонът трябва да бъде във формат: +359888000000",
      passwordTooShort: "Паролата трябва да бъде поне 8 символа",
      serverError: "Грешка при регистрация. Моля, опитайте отново."
    }
  },

  // About
  // About Page
  about: {
    title: "За Пантастик",
    subtitle: "Предоставяне на лукса на избор, ежедневно. В Pantastic направихме революция в изкуството на правене на палачинки, предоставяйки ви перфектна комбинация от традиционни вкусове и модерни иновации.",
    deliciousPancakes: "Вкусни пантастични палачинки",
    
    missionTitle: "Нашата мисия",
    missionSubtitle: "Да направим радостта достъпна",
    missionDesc: "Да донесем вкусни, висококачествени палачинки на всеки, правейки всеки ден малко по-специален с нашите уникални вкусове и комбинации.",
    
    visionTitle: "Нашата визия",
    visionSubtitle: "Водеща иновация",
    visionDesc: "Да направи революция в индустрията за палачинки чрез иновативни рецепти, устойчиви практики и изключително обслужване на клиентите.",
    
    valuesTitle: "Нашите ценности",
    valuesSubtitle: "Качество и грижа",
    valuesDesc: "Вярваме в използването на първокласни съставки, поддържането на най-високите стандарти за качество и отношението към всеки клиент като към семейство.",
    
    journeyTitle: "Нашето пътуване",
    journeySubtitle: "От проста идея до палачинкова революция",
    journey2020: "Започва като малък местен магазин за палачинки с визия да революционизира закуската.",
    journey2021: "Открихме три нови места и представихме нашите характерни рецепти.",
    journey2022: "Стартирахме нашата програма за екологични опаковки и устойчиви източници.",
    journey2023: "Представихме нашето ново мобилно приложение и програма за награди, за да подобрим изживяването на клиентите.",
    
    kitchenTitle: "Нашата кухня",
    kitchenSubtitle: "Качествени съставки",
    kitchenDesc: "Ние доставяме само най-добрите съставки, за да гарантираме, че всяка палачинка отговаря на нашите високи стандарти за съвършенство.",
    
    teamTitle: "Нашият екип",
    teamSubtitle: "Експертен екип",
    teamDesc: "Нашите квалифицирани готвачи и всеотдаен персонал работят заедно, за да създадат перфектното изживяване при хранене."
  },

  // User Dashboard
  dashboard: {
    title: "Моето табло",
    welcome: "Добре дошли",
    myOrders: "Моите поръчки",
    recentOrders: "Последни поръчки",
    noOrders: "Все още нямате поръчки",
    noOrdersDesc: "Започнете да поръчвате от нашето меню",
    orderAgain: "Поръчай отново",
    viewOrder: "Виж поръчка",
    accountInfo: "Информация за акаунта",
    editProfile: "Редактирай профил",
    changePassword: "Промени парола",
    myAccount: "Моят акаунт",
    profile: "Профил",
    orders: "Поръчки",
    favourites: "Любими",
    personalInformation: "Лична информация",
    personalInformationDesc: "Управлявайте личната си информация и контактните си данни",
    orderHistory: "История на поръчките",
    orderHistoryDesc: "Прегледайте всички ваши предишни поръчки",
    loadingOrders: "Зареждане на поръчките...",
    failedToLoadOrders: "Неуспешно зареждане на поръчките",
    orderNumber: "Поръчка",
    items: "Артикули",
    deliveryAddress: "Адрес за доставка",
    deliveryTime: "Време за доставка",
    deliveryPerson: "Куриер",
    pending: "В изчакване",
    favouriteItems: "Любими артикули",
    favouriteItemsDesc: "Вашите запазени любими артикули от менюто",
    loadingFavourites: "Зареждане на любимите...",
    noFavouriteItems: "Все още няма любими артикули.",
    seeDetails: "Виж детайли"
  },

  // Common
  common: {
    loading: "Зареждане...",
    error: "Грешка",
    success: "Успех",
    cancel: "Отказ",
    confirm: "Потвърди",
    save: "Запази",
    delete: "Изтрий",
    edit: "Редактирай",
    add: "Добави",
    remove: "Премахни",
    close: "Затвори",
    back: "Назад",
    next: "Напред",
    previous: "Предишно",
    search: "Търси",
    filter: "Филтър",
    sort: "Сортирай",
    viewAll: "Виж всички",
    showMore: "Покажи повече",
    showLess: "Покажи по-малко",
    yes: "Да",
    no: "Не",
    ok: "OK",
    or: "или",
    required: "Задължително",
    optional: "По избор",
    select: "Избери",
    selected: "Избрано",
    all: "Всички",
    none: "Нищо",
    other: "Друго",
    pageNotFound: "Страницата не е намерена",
    pageNotFoundDesc: "Упс! Страницата, която търсите, не съществува.",
    pageNotFoundHint: "Възможно е да е преместена, изтрита или сте въвели грешен URL адрес.",
    goHome: "Към начало",
    goBack: "Назад",
    unexpectedError: "Неочаквана грешка"
  },

  // Time
  time: {
    today: "Днес",
    tomorrow: "Утре",
    yesterday: "Вчера",
    at: "в",
    monday: "Понеделник",
    tuesday: "Вторник",
    wednesday: "Сряда",
    thursday: "Четвъртък",
    friday: "Петък",
    saturday: "Събота",
    sunday: "Неделя",
    minutes: "минути",
    hours: "часа",
    days: "дни"
  },

  // Footer
  footer: {
    aboutUs: "За нас",
    contactUs: "Свържете се с нас",
    privacyPolicy: "Политика за поверителност",
    termsOfService: "Условия за ползване",
    followUs: "Последвайте ни",
    allRightsReserved: "Всички права запазени",
    email: "Имейл",
    phone: "Телефон",
    address: "Адрес"
  },

  // Notifications/Toasts
  notifications: {
    addedToCart: "Добавено в количката",
    removedFromCart: "Премахнато {name} от количката",
    orderPlaced: "Поръчката е направена успешно!",
    orderFailed: "Неуспешна поръчка",
    loginSuccess: "Успешен вход!",
    loginFailed: "Неуспешен вход",
    logoutSuccess: "Излязохте успешно",
    signupSuccess: "Акаунтът е създаден успешно!",
    signupFailed: "Неуспешна регистрация",
    accountCreated: "Акаунтът е създаден успешно! Продължаваме към поръчка...",
    updateSuccess: "Актуализирано успешно",
    updateFailed: "Неуспешна актуализация",
    deleteSuccess: "Изтрито успешно",
    deleteFailed: "Неуспешно изтриване",
    errorOccurred: "Възникна грешка",
    tryAgain: "Моля, опитайте отново"
  }
};

// Helper function to get nested translation with parameter support
export const t = (key, params = {}) => {
  const keys = key.split('.');
  let value = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }
  
  let result = value || key;
  
  // Replace parameters if any
  if (typeof result === 'string' && Object.keys(params).length > 0) {
    Object.keys(params).forEach(param => {
      result = result.replace(`{${param}}`, params[param]);
    });
  }
  
  return result;
};

export default translations;
