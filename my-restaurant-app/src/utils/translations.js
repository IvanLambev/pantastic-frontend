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
    dashboard: "Профил",
    orders: "Поръчки",
    profile: "Профил"
  },

  // Home Page
  home: {
    heroTitle: "Добре дошли в Pantastic",
    heroSubtitle: "Автентични български палачинки направени с любов",
    orderNow: "Поръчай сега",
    viewMenu: "Виж менюто",
    lookAtOurMenu: "Разгледай нашето меню",
    featuredItems: "Представени артикули",
    featuredItemsDesc: "Нашите най-популярни и препоръчани ястия",
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
    addToCart: "Добави",
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
    americanPancakes: "Американски палачинки",
    american: "Американски",
    americanMiniPancakes: "Американски мини палачинки",
    americanMini: "Американски Мини",
    drinks: "Напитки",
    search: "Търсене",
    options: "Добавки",
    add: "Добави",
    priceRange: "Ценови диапазон",
    extrasAvailable: "Налични екстри",
    customizable: "Персонализируемо",
    removed: "Премахнато",
    instructions: "Инструкции",
    sortBy: "Сортирай по",
    default: "По подразбиране",
    priceLowToHigh: "Цена: ниска към висока",
    priceHighToLow: "Цена: висока към ниска",
    mostOrdered: "Най-поръчвани",
    item: "артикул",
    items: "артикула",
    open: "Отворено",
    closed: "Затворено",
    today: "Днес",
    restaurantClosed: "Ресторантът е затворен",
    nextOpening: "Следващо отваряне",
    noOpenRestaurantsNearby: "Не са намерени отворени ресторанти в радиус от 10 км",
    tryAgainLater: "Моля, опитайте отново по-късно",
    findingNearestOpen: "Търсене на най-близък отворен ресторант...",
    autoSelected: "Автоматично избран ресторант: {name}",
    addedToCart: "Добавено {name} в количката",
    // Labels
    labels: {
      new: "Ново",
      popular: "Популярно",
      featured: "Представено",
      bestseller: "Бестселър",
      recommended: "Препоръчано"
    },
    // Dynamic labels (personalized recommendations)
    dynamicLabels: {
      "Buy it again": "Купи отново",
      "Buy again": "Купи отново",
      "Personalized for you": "Персонализирано за теб",
      "You might like": "Може да ти хареса",
      "Trending": "Популярно сега",
      "Your favorite": "Любимо",
      "Previously ordered": "Предишни поръчки",
      "Recommended for you": "Препоръчано за теб"
    }
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
    clearedForNewRestaurant: "Количката беше изчистена за новия ресторант",
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

  // Misc items suggestions
  misc: {
    suggestTitle: "Може би ще харесате?",
    suggestSubtitle: "Добавете напитки или други артикули към поръчката си"
  },

  // Checkout
  checkout: {
    title: "Поръчка",
    subtitle: "Завършете поръчката си",
    completeOrder: "Завършете поръчката си",
    accountRequired: "Изисква се акаунт",
    accountRequiredDesc: "Влезте или създайте акаунт, за да завършите поръчката си",
    signIn: "Вход",
    signInOrContinue: "Вход или продължете като гост",
    signInForFasterCheckout: "Влезте за по-бърза поръчка",
    signInDesc: "Използвайте вашия акаунт за по-бърза поръчка и проследяване на поръчките",
    signUp: "Регистрация",
    or: "Или",
    guestCheckout: "Поръчка като гост",
    guestCheckoutDesc: "Продължете без акаунт",
    continueAsGuest: "Продължи като гост",
    proceedingAsGuest: "Поръчката направена успешно",
    processing: "Обработка...",
    createAccountCheckout: "Създай акаунт и поръчай",
    createAccountAndCheckout: "Създай акаунт и поръчай",
    createAccountAndContinue: "Създай акаунт и продължи",
    accountCreatedSuccess: "Акаунтът е създаден успешно",
    accountCreationError: "Грешка при създаване на акаунт",
    failedToCreateAccount: "Неуспешно създаване на акаунт",
    networkError: "Грешка в мрежата. Моля, проверете връзката си",
    back: "Назад",
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

    // Guest form placeholders and validation
    guest: {
      firstName: "Име",
      lastName: "Фамилия",
      email: "Имейл",
      phone: "Телефон",
      city: "Град",
      firstNamePlaceholder: "Иван",
      lastNamePlaceholder: "Иванов",
      emailPlaceholder: "name@example.com",
      phonePlaceholder: "+359888000000",
      phoneFormat: "Формат: +359888000000",
      cityPlaceholder: "София",
      passwordPlaceholder: "Създайте силна парола",
      passwordHint: "Минимум 8 символа",
      allFieldsRequired: "Всички полета са задължителни",
      invalidEmail: "Моля, въведете валиден имейл адрес",
      invalidPhone: "Телефонът трябва да е във формат: +359888000000",
      guestCheckoutFailed: "Неуспешна поръчка като гост",
      proceedingAsGuest: "Продължавате като гост"
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
    loginToApplyDiscount: "Моля, влезте, за да приложите отстъпка",
    invalidDiscountCode: "Невалиден код за отстъпка",
    discountValidationError: "Грешка при проверка на кода за отстъпка",
    discountExpired: "Кодът за отстъпка е изтекъл",

    // Delivery/Pickup address editing
    editDeliveryAddress: "Редактирай адрес за доставка",
    updateDeliveryAddress: "Актуализирайте вашия адрес за доставка",
    enterNewAddress: "Въведете нов адрес",
    saveAddress: "Запази адрес",

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

    // Cutlery request
    requestCutlery: "Искам прибори",
    requestCutleryDesc: "Добавете прибори към вашата поръчка",

    // Delivery info
    deliveryAddress: "Адрес за доставка",
    deliveryTo: "Доставка до този адрес",
    deliveryToAddress: "Доставка до този адрес",
    edit: "Редактирай",
    pickupLocation: "Място за вземане",
    calculating: "Изчисляване",
    distance: "Разстояние",

    // Restaurant selection
    selectedRestaurant: "Избран ресторант",
    changeRestaurant: "Промени",
    changeRestaurantTitle: "Промяна на ресторант?",
    changeRestaurantWarning: "Промяната на ресторанта ще изчисти текущата ви количка. Ще трябва да изберете артикули отново от новия ресторант.",
    changeRestaurantConfirm: "Сигурни ли сте, че искате да продължите?",
    yesChangeRestaurant: "Да, промени ресторанта",
    cartWillBeCleared: "Количката е изчистена. Моля, изберете нов ресторант.",
    changeAddressWarning: "Промяната на адреса за доставка може да изисква избор на друг ресторант и ще изчисти количката ви.",

    // Scheduling
    scheduleDelivery: "Планирай доставка",
    scheduleDesc: "Искате да получите поръчката си по-късно?",
    scheduleOrder: "Планирай поръчка",
    selectDate: "Избери дата",
    selectTime: "Избери час",
    time: "Час",
    scheduleNote1: "Можете да планирате поръчки до 3 дни предварително",
    scheduleNote3: "Часовете са на 30-минутни интервали",
    scheduleYourDelivery: "Планирайте вашата доставка",
    selectDay: "Изберетеден",
    selectTimeSlot: "Изберете час",
    chooseDay: "Изберете ден",
    chooseTime: "Изберете час",
    deliveryScheduled: "Доставка планирана",
    deliveryScheduledMsg: "Вашата поръчка ще бъде доставена на",
    restaurantClosedSchedule: "е затворен в момента. Моля, изберете време за доставка, което съответства на работното време на ресторанта.",
    today: "днес",
    tomorrow: "утре",
    at: "в",
    scheduledDelivery: "Планирана доставка",
    day: "Ден",

    // Order timing
    orderTiming: "Време за поръчка",
    orderTimingDesc: "Планирайте поръчката си за определено време (по желание)",
    scheduleForLater: "Планирай за по-късно",

    // Order summary
    orderSummary: "Обобщение на поръчката",
    reviewOrder: "Прегледай поръчка",
    restaurantClosed: "Ресторантът е затворен",
    restaurantClosedMsg: "Ресторантът в момента е затворен",
    comingSoonRestaurant: "Този ресторант е в процес на откриване. Очаквайте скоро.",
    nextOpening: "Следващо отваряне",
    processingPayment: "Обработка на плащане...",

    // Order confirmation
    confirmOrder: "Потвърди поръчка",
    orderItems: "Артикули от поръчката",
    restaurantDetails: "Детайли за ресторанта",
    estimatedTime: "Очаквано време",
    estimatedDeliveryTime: "Очаквано време за доставка",
    deliveryLocation: "Място за доставка",
    pickupFromRestaurant: "Вземане от ресторант",
    arriveAtEstimatedTime: "Моля, пристигнете в очакваното време, за да получите поръчката си",
    cashOn: "В брой при {method}",
    backToCart: "Обратно към количката",
    placingOrder: "Обработваме поръчката...",
    pickupInformation: "Информация за вземане",
    orderPlacedSuccess: "Поръчката е направена успешно!",
    failedToPlaceOrder: "Неуспешно поръчване",

    // Phone requirement
    phoneRequired: "Необходим е телефонен номер",
    phoneRequiredTitle: "Добавете телефонен номер",
    phoneRequiredDesc: "Моля, добавете телефонен номер, за да завършите поръчката си",
    phonePlaceholder: "+359888000000",
    invalidPhone: "Телефонът трябва да е във формат: +359888000000",
    phoneUpdateError: "Грешка при обновяване на телефона",
    saveAndContinue: "Запази и продължи",
    updating: "Обновяване...",
    retryingOrder: "Повторен опит за поръчване...",
    cancel: "Отказ",
    orderError: "Грешка при поръчване",
    minutes: "минути",

    // Errors
    pleaseSignIn: "Моля, влезте или създайте акаунт, за да продължите",
    userNotLoggedIn: "Потребителят не е влязъл. Моля, рестартирайте процеса на поръчване."
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
    comingSoon: "Очаквайте скоро",
    opensAt: "Отваря в",
    closesAt: "Затваря в",

    distanceWarning: "Предупреждение за разстояние",
    distanceMessage: "Най-близкият работещ ресторант е на {distance} км от вашето местоположение.",
    distanceWarningMessage: "Най-близкият работещ ресторант \"{name}\" е на {distance} км от вашето местоположение. Поради разстоянието, доставката може да отнеме повече време и таксите може да бъдат по-високи от обичайното. Искате ли да продължите?",
    distanceQuestion: "Поради разстоянието, таксите за доставка може да бъдат по-високи от обичайното. Искате ли да продължите с този ресторант?",
    yesSelect: "Да, изберете този ресторант",
    tryDifferent: "Опитайте друго местоположение",
    tryDifferentOrManualSelect: "Опитайте друго местоположение или изберете ръчно ресторант.",

    noRestaurantsOpen: "В момента няма отворени ресторанти",
    noRestaurantsOpenDesc: "Няма отворени ресторанти за поръчка в момента, но можете да разгледате менюто на най-близкия ресторант.",
    noRestaurantsOpenInRadius: "В момента няма отворени ресторанти в радиус от {radius} км от вашето местоположение.",
    noRestaurantsFoundNearby: "Не са намерени ресторанти близо до това местоположение.",
    nextOpening: "Следващо отваряне:",
    checkBackLater: "Проверете по-късно за наличност.",
    todayAt: "Днес в {time}",
    tomorrowAt: "Утре в {time}",
    dayAt: "{day} в {time}",
    nearestRestaurant: "Най-близък ресторант",
    browseMenu: "Разгледай менюто",
    closedRestaurantWarning: "Този ресторант е затворен в момента. Можете да разгледате менюто, но не можете да направите поръчка, докато не отвори.",
    addressNotAvailable: "Адресът не е наличен",
    unknownRestaurant: "Неизвестен ресторант",
    deviceLocation: "Локация на устройството",
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
    email: "Имейл",
    emailLabel: "Имейл",
    emailPlaceholder: "name@example.com",
    password: "Парола",
    passwordLabel: "Парола",
    passwordPlaceholder: "Въведете вашата парола",
    forgotPassword: "Забравена парола?",
    loginButton: "Вход",
    loggingIn: "Влизане...",
    signingIn: "Влизане...",
    noAccount: "Нямате акаунт?",
    signUpLink: "Регистрирайте се",
    googleLoginSuccess: "Успешно влизане с Google!",
    fillAllFields: "Моля, попълнете всички полета",
    invalidCredentials: "Невалидни данни за вход",
    loginFailed: "Неуспешен вход. Моля, опитайте отново",
    loginSuccess: "Успешно влизане!",
    errors: {
      emailRequired: "Имейлът е задължителен",
      passwordRequired: "Паролата е задължителна",
      invalidCredentials: "Невалидни данни",
      serverError: "Грешка на сървъра. Моля, опитайте отново.",
      googleLoginFailed: "Неуспешно влизане с Google. Моля, опитайте отново."
    }
  },

  // Password Reset
  passwordReset: {
    title: "Възстановяване на парола",
    subtitle: "Няма проблем, ще ви изпратим инструкции за възстановяване.",
    pageTitle: "Нова парола",
    pageSubtitle: "Въведете вашата нова парола по-долу",
    description: "Въведете вашия имейл адрес и ще ви изпратим линк за възстановяване на паролата.",
    sendButton: "Изпрати линк за възстановяване",
    sending: "Изпращане...",
    checkEmail: "Проверете вашия имейл",
    emailSent: "Изпратихме ви линк за възстановяване на паролата.",
    emailInstructions: "Проверете вашата пощенска кутия и кликнете на линка в имейла, за да възстановите паролата си. Линкът е валиден за 1 час.",
    sendAnother: "Изпрати друг имейл",
    rememberPassword: "Спомняте си паролата си?",
    backToLogin: "Обратно към вход",
    validatingToken: "Проверка на линка...",
    invalidTokenTitle: "Невалиден линк",
    requestNew: "Поискай нов линк",
    resetTitle: "Създайте нова парола",
    resetDescription: "Въведете нова парола за вашия акаунт",
    newPasswordLabel: "Нова парола",
    newPasswordPlaceholder: "Въведете нова парола",
    confirmPasswordLabel: "Потвърдете паролата",
    confirmPasswordPlaceholder: "Въведете паролата отново",
    resetButton: "Възстанови парола",
    resetting: "Възстановяване...",
    successTitle: "Паролата е възстановена!",
    successMessage: "Паролата ви беше успешно променена. Вече можете да влезете с новата си парола.",
    redirecting: "Пренасочване към страницата за вход...",
    errors: {
      noToken: "Липсващ токен за възстановяване",
      invalidToken: "Този линк за възстановяване е невалиден или изтекъл. Моля, поискайте нов.",
      requestFailed: "Неуспешно изпращане на имейл за възстановяване",
      resetFailed: "Неуспешно възстановяване на паролата",
      serverError: "Грешка на сървъра. Моля, опитайте отново.",
      passwordMismatch: "Паролите не съвпадат"
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
    pickupLocation: "Място за вземане",
    deliveryTime: "Време за доставка",
    deliveryPerson: "Куриер",
    pending: "В изчакване",
    favouriteItems: "Любими артикули",
    favouriteItemsDesc: "Вашите запазени любими артикули от менюто",
    loadingFavourites: "Зареждане на любимите...",
    noFavouriteItems: "Все още няма любими артикули.",
    seeDetails: "Виж детайли",
    deleteAccount: "Изтрий акаунт",
    deleteAccountConfirm: "Сигурни ли сте, че искате да изтриете акаунта си? Това действие не може да бъде отменено.",
    deleteAccountSuccess: "Акаунтът беше изтрит успешно",
    deleteAccountError: "Възникна грешка при изтриването на акаунта",
    name: "Име",
    email: "Имейл",
    phoneNumber: "Телефонен номер",
    noOrdersYet: "Все още няма поръчки",
    noOrdersYetDesc: "Когато направите поръчки, те ще се появят тук.",
    // Status translations
    status: {
      ready: "Готова",
      processing: "В процес",
      delivered: "Доставена",
      pending: "В изчакване",
      cancelled: "Отменена",
      preparing: "Подготвя се",
      ontheway: "В движение",
      completed: "Завършена"
    }
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
    tryAgain: "Моля, опитайте отново",
    paymentVerified: "Плащането е потвърдено успешно!",
    paymentVerificationFailed: "Неуспешна проверка на плащането"
  },

  // Payment Success Page
  paymentSuccess: {
    verifyingTitle: "Проверка на плащането...",
    successTitle: "Плащането е успешно!",
    failedTitle: "Неуспешно плащане",
    verifyingMessage: "Моля, изчакайте, докато проверяваме вашето плащане.",
    successMessage: "Вашето плащане е обработено успешно. Скоро ще бъдете пренасочени към проследяване на поръчката.",
    failedMessage: "Възникна проблем при обработката на вашето плащане. Моля, опитайте отново.",
    viewOrder: "Виж поръчка",
    backToCart: "Обратно към количката",
    redirecting: "Автоматично пренасочване след 3 секунди..."
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

// Helper function to translate static labels (new, popular, etc.)
export const translateLabel = (label) => {
  if (!label) return label;
  const lowerLabel = label.toLowerCase();
  const translationKey = `menu.labels.${lowerLabel}`;
  const translated = t(translationKey);
  // Return translation only if it's different from the key (meaning it was found)
  return translated !== translationKey ? translated : label;
};

// Helper function to translate dynamic labels (Buy again, Personalized for you, etc.)
export const translateDynamicLabel = (label) => {
  if (!label) return label;

  // Normalize the label (trim whitespace)
  const normalizedLabel = String(label).trim();

  // Check if we have a direct translation in dynamicLabels
  if (translations.menu && translations.menu.dynamicLabels) {
    // First try exact match
    if (translations.menu.dynamicLabels[normalizedLabel]) {
      return translations.menu.dynamicLabels[normalizedLabel];
    }

    // Try case-insensitive match
    const lowerLabel = normalizedLabel.toLowerCase();
    const matchingKey = Object.keys(translations.menu.dynamicLabels).find(
      key => key.toLowerCase() === lowerLabel
    );

    if (matchingKey) {
      return translations.menu.dynamicLabels[matchingKey];
    }
  }

  // Return original label if no translation found
  return normalizedLabel;
};

export default translations;
