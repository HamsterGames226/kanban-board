const ru = {
  // ===== ОБЩЕЕ =====
  common: {
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Изменить',
    close: 'Закрыть',
    confirm: 'Подтвердить',
    loading: 'Загрузка...',
    search: 'Поиск',
    add: 'Добавить',
    create: 'Создать',
    copy: 'Копировать',
    copied: '✓ Скопировано!',
    yes: 'Да',
    no: 'Нет',
    or: 'или',
    back: 'Назад',
    next: 'Далее',
    done: 'Готово',
    error: 'Ошибка',
    success: 'Успешно',
    warning: 'Внимание',
    noData: 'Нет данных',
    required: '*',
    reconnecting: '⚠️ Переподключение...',
  },

  // ===== АВТОРИЗАЦИЯ =====
  auth: {
    login: 'Войти',
    register: 'Зарегистрироваться',
    logout: 'Выйти',
    welcomeBack: 'С возвращением!',
    welcomeSubtitle: 'Мы рады видеть тебя снова!',
    createAccount: 'Создать аккаунт',
    createSubtitle: 'Начни работать с командой!',
    email: 'Email',
    password: 'Пароль',
    confirmPassword: 'Подтвердите пароль',
    username: 'Имя пользователя',
    enterEmail: 'Введите email',
    enterPassword: 'Введите пароль',
    chooseName: 'Придумайте имя',
    createPassword: 'Придумайте пароль',
    repeatPassword: 'Повторите пароль',
    loggingIn: 'Вход...',
    creatingAccount: 'Создание...',
    noAccount: 'Нет аккаунта?',
    hasAccount: 'Уже есть аккаунт?',
    passwordsNotMatch: 'Пароли не совпадают',
    passwordMinLength: 'Пароль должен быть минимум 6 символов',
    loginError: 'Ошибка входа',
    registerError: 'Ошибка регистрации',
    invalidCredentials: 'Неверный email или пароль',
    emailInUse: 'Этот email уже используется',
    usernameTaken: 'Это имя уже занято',
    serverError: 'Ошибка сервера',
  },

  // ===== НАВИГАЦИЯ =====
  nav: {
    home: 'Главная',
    settings: 'Настройки',
    dashboard: 'Панель управления',
  },

  // ===== ДАШБОРД =====
  dashboard: {
    welcome: 'Добро пожаловать, {name}! 👋',
    subtitle: 'Ваши доски и проекты',
    quickActions: 'Быстрые действия',
    createBoard: 'Создать доску',
    joinBoard: 'Присоединиться',
    yourBoards: 'Ваши доски',
    noBoards: 'Досок пока нет',
    noBoardsDesc: 'Создайте первую доску для организации задач',
    members: '{count} участников',
    noDescription: 'Без описания',

    // Создание доски
    createBoardTitle: 'Создать доску',
    createBoardSubtitle: 'Организуйте задачи на новой доске',
    boardName: 'Название',
    boardNamePlaceholder: 'Например: Проект Альфа',
    boardDescription: 'Описание',
    boardDescPlaceholder: 'О чём эта доска?',

    // Присоединение
    joinBoardTitle: 'Присоединиться к доске',
    joinBoardSubtitle: 'Введите код приглашения',
    inviteCode: 'Код приглашения',
    inviteCodePlaceholder: 'Введите код',
    join: 'Присоединиться',

    // Удаление
    deleteBoardConfirm: 'Удалить эту доску и все её данные?',
    deleteError: 'Ошибка удаления',
    createError: 'Ошибка создания доски',
  },

  // ===== ДОСКА =====
  board: {
    editBoardTitle: 'Редактировать доску',
    boardTitleLabel: 'Название доски',
    boardDescLabel: 'Описание доски',
    boardBackground: 'Фон доски',
    bgColor: 'Цвет',
    bgGradient: 'Градиент',
    bgImage: 'Изображение',
    bgImageUrl: 'URL изображения',
    bgImagePlaceholder: 'Вставьте ссылку на изображение...',
    viewerCantEdit: 'Вы наблюдатель — только просмотр',

    members: 'Участники',
    invite: 'Пригласить',
    addColumn: 'Добавить столбец',
    columnTitle: 'Название столбца...',
    addCard: 'Добавить карточку',
    cardTitle: 'Название карточки...',
    deleteColumnConfirm: 'Удалить "{name}" и все карточки?',
    loadingBoard: 'Загрузка доски...',
    boardNotFound: 'Доска не найдена',
    editBoard: 'Редактировать доску',

    // Столбцы по умолчанию
    defaultColumns: {
      todo: 'Надо сделать',
      inProgress: 'В работе',
      review: 'На проверке',
      done: 'Готово',
    },

    // Сроки
    due: {
      overdue: 'Просрочено',
      today: 'Сегодня',
      tomorrow: 'Завтра',
      days: '{count} дн.',
    },
  },

  // ===== КАРТОЧКА =====
  card: {
    labels: 'Метки',
    assignees: 'Исполнители',
    description: 'Описание',
    descriptionPlaceholder: 'Добавьте описание...',
    checklist: 'Чеклист',
    checklistItem: 'Добавить пункт...',
    comments: 'Комментарии',
    commentPlaceholder: 'Напишите комментарий...',
    priority: 'Приоритет',
    dueDate: 'Срок',
    addLabel: 'Добавить метку',
    labelText: 'Текст метки',
    deleteCard: 'Удалить карточку',
    deleteCardConfirm: 'Удалить эту карточку?',
    justNow: 'только что',
    minutesAgo: '{count}м назад',
    hoursAgo: '{count}ч назад',

    // Приоритеты
    priorities: {
      none: 'Без приоритета',
      low: '🔵 Низкий',
      medium: '🟡 Средний',
      high: '🟠 Высокий',
      critical: '🔴 Критический',
    },
    priorityLabels: {
      none: 'нет',
      low: 'низкий',
      medium: 'средний',
      high: 'высокий',
      critical: 'критический',
    },
  },

  // ===== ПРИГЛАШЕНИЕ =====
  invite: {
    title: 'Пригласить в {name}',
    searchUsers: 'Поиск пользователей',
    searchPlaceholder: 'Поиск по имени или email...',
    shareCode: 'Или поделитесь кодом приглашения',
    generateNew: 'Сгенерировать новый код',
    inviteBtn: 'Пригласить',
    invalidCode: 'Неверный код приглашения',
    alreadyMember: 'Вы уже участник',
  },

  // ===== УЧАСТНИКИ =====
  members: {
    title: 'Участники',
    online: 'В сети',
    offline: 'Не в сети',
    you: '(вы)',
    leaveBoard: 'Покинуть доску',
    leaveBoardConfirm: 'Покинуть доску?',
    removeMember: 'Удалить с доски',
    removeMemberConfirm: 'Удалить {name} с доски?',
    changeRole: 'Изменить роль',

    // Роли
    roles: {
      owner: '👑 Владелец',
      admin: '🛡️ Админ',
      member: '👤 Участник',
      viewer: '👁️ Наблюдатель',
    },
    roleNames: {
      owner: 'Владелец',
      admin: 'Администратор',
      member: 'Участник',
      viewer: 'Наблюдатель',
    },

    // Ошибки ролей
    onlyOwnerAdmin: 'Только владелец может назначать администраторов',
    noPermission: 'Нет прав для изменения ролей',
    cantChangeOwner: 'Нельзя изменить роль владельца',
    cantKickOwner: 'Нельзя удалить владельца',
    adminCantKickAdmin: 'Администратор не может удалить другого администратора',
    noKickPermission: 'Нет прав для удаления участников',
    onlyOwnerDelete: 'Только владелец может удалить доску',
    onlyAdminEdit: 'Только владелец или администратор может изменять доску',
    noInvitePermission: 'Нет прав для приглашения',
    userAlreadyMember: 'Пользователь уже участник',
  },

  // ===== ПРОФИЛЬ =====
  profile: {
    title: 'Настройки аккаунта',
    saved: 'Профиль сохранён',

    // Аватар
    avatar: 'Аватарка',
    uploadPhoto: 'Загрузить фото',
    removePhoto: 'Удалить',
    avatarColor: 'Цвет аватарки (если нет фото)',
    avatarUploaded: 'Аватарка загружена',
    avatarRemoved: 'Аватарка удалена',
    uploadError: 'Ошибка загрузки',

    // Профиль
    profileSection: 'Профиль',
    displayName: 'Отображаемое имя',
    displayNamePlaceholder: 'Как вас называть?',
    bio: 'О себе',
    bioPlaceholder: 'Расскажите о себе...',
    statusText: 'Статус',
    statusPlaceholder: 'Что делаете?',
    saveProfile: 'Сохранить профиль',
    saving: 'Сохранение...',

    // Язык
    language: 'Язык интерфейса',
    languageDesc: 'Выберите язык отображения',

    // Аккаунт
    account: 'Аккаунт',
    changeUsername: 'Изменить имя пользователя',
    newUsername: 'Новое имя',
    usernameChanged: 'Имя изменено',
    usernameMinLength: 'Имя должно быть минимум 3 символа',
    usernameTaken: 'Это имя уже занято',

    changeEmail: 'Изменить Email',
    newEmail: 'Новый email',
    currentPassword: 'Текущий пароль',
    emailChanged: 'Email изменён',
    emailInUse: 'Этот email уже используется',
    wrongPassword: 'Неверный пароль',

    changePassword: 'Изменить пароль',
    newPassword: 'Новый пароль (мин. 6 символов)',
    confirmNewPassword: 'Подтвердите новый пароль',
    passwordChanged: 'Пароль изменён',
    passwordMinLength: 'Пароль должен быть минимум 6 символов',
    currentPasswordWrong: 'Текущий пароль неверный',

    // Удаление аккаунта
    dangerZone: 'Опасная зона',
    dangerDesc: 'Удаление аккаунта необратимо. Все ваши данные будут потеряны.',
    deleteAccount: 'Удалить аккаунт',
    deleteConfirmText: 'Введите пароль для подтверждения:',
    deleteForever: 'Удалить навсегда',
    accountDeleted: 'Аккаунт удалён',
  },
};

export default ru;