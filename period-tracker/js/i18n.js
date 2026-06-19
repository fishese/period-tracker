"use strict";

// ─── Plural rule helpers ──────────────────────────────────────────────────────

function pluralSlavic(n) {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return "one";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "few";
  return "many";
}

function pluralSimple(n) {
  return Math.abs(n) === 1 ? "one" : "many";
}

function pluralFlat() {
  return "many";
}

const PLURAL_FN = {
  en: pluralSimple,
  ru: pluralSlavic,
  be: pluralSlavic,
  es: pluralSimple,
  ja: pluralFlat,
  "zh-TW": pluralFlat,
};

// ─── Locale data ──────────────────────────────────────────────────────────────

const LOCALES = {
  // ── English ────────────────────────────────────────────────────────────────
  en: {
    // About section (About, Privacy, Support, Disclaimer, Accessibility)
    about_tab_developer: "Developer",
    about_tab_privacy: "Privacy",
    about_tab_disclaimer: "Disclaimer",
    privacy_title: "Privacy Guarantee",
    privacy_info:
      "My Cycle Keeper collects zero data. This app: Stores all data locally on your device only; Has no servers, no accounts, no cloud storage; Has no analytics, no tracking, no telemetry; Has no ads, no third-party code; Never transmits any data anywhere; Is encrypted with your PIN via AES-256-GCM. Your health data is yours alone.",

    about_title: "About Your Cycle Keeper",
    about_info:
      "Your Cycle Keeper is free software built with care for privacy. Based on the Calendar Rhythm Method and Standard Days Method for cycle estimation. For informational purposes only. Version: 1.0.0-beta. License: GPL v3 License. Developer: pythonime-lab. Found a bug or have a suggestion? Visit our GitHub repository.",

    support_title: "Support Development",
    support_info:
      "My Cycle Keeper is free forever with no ads, no tracking, and no data collection. If you find it helpful and would like to support continued development, you can buy me a coffee! Your support helps keep this project maintained and ad-free for everyone. Thank you! 💜",

    disclaimer_title: "Medical Disclaimer",
    disclaimer_info:
      "⚠️ This app provides cycle estimations based on average biological patterns. It is not medical advice and must not be used as a substitute for professional medical consultation. My Cycle Keeper predicts your cycle by tracking patterns and estimating ovulation timing. Actual cycle timing can vary due to stress, illness, medications, and many other factors. Do not use this app as a contraceptive or fertility guarantee. Always consult a qualified healthcare professional for medical decisions.",

    accessibility_title: "Accessibility",
    accessibility_info:
      "My Cycle Keeper follows WCAG 2.0 accessibility standards: Tab/Shift+Tab: Navigate forward/backward through all interactive elements; Arrow Keys: Navigate calendar dates (complex grid component); Enter/Space: Activate buttons and links; Escape: Close modals and return focus to trigger element; PIN Entry: Type digits 0-9 and Backspace on all PIN screens; Form Controls: Native keyboard support for inputs, selects, and textareas; Screen Readers: Semantic HTML with proper ARIA labels and roles; Focus Management: Visible focus indicators, logical tab order. Standards based on Salesforce Accessibility Guidelines.",

    cycle_stats: "Cycle Stats",
    avg_length: "Avg Length",
    cycles_logged: "Cycles Logged",
    avg_period: "Avg Period",
    fertile_days: "Fertile Days",
    symptom_tracking: "Symptom Tracking",
    period: "Period",
    ovulation: "Ovulation",
    flow: "Flow",
    pain: "Pain",
    mood: "Mood",
    how_it_works: "How it Works",
    how_it_works_p1:
      "My Cycle Keeper estimates your fertile window by tracking cycle patterns. Ovulation is estimated ~14 days before your next period. Fertile days are calculated as day 8 through (cycle length − 11).",
    how_it_works_p2:
      "For regular 28-day cycles, this means days 8–17 are typically fertile, with ovulation around day 14.",
    disclaimer: "Disclaimer",
    estimation_disclaimer:
      "⚠️ This is an estimation tool only. Not for contraception. Stress, illness & medications can shift timing.",
    no_symptoms_logged: "No symptoms logged yet — start by logging today",
    cycle_history: "Cycle History",
    all_months: "All Months",
    cycle_day: "Cycle Day",
    until_next: "Until Next",
    day_1: "Day 1",
    avg_length_short: "Avg Length",
    period_short: "Period",
    fertile: "Fertile",
    ovulation_short: "Ovulation",
    luteal: "Luteal",

    // Storage / init errors
    storage_error_title: "Storage Error",
    storage_error_msg: "Could not access storage. Please refresh the page.",
    db_error_title: "Database Error",
    db_error_msg:
      "Could not initialize app storage. Please try refreshing the page.",

    // Lock screen / PIN
    unlock_subtitle: "Enter your PIN to unlock your private health data",
    too_many_attempts: "Too many attempts. Try again in {secs}s.",
    locked_out: "🚫 Too many attempts. Locked for 60 seconds.",
    lockout_ended: "Lockout ended. Try again.",
    incorrect_pin_one: "Incorrect PIN. {remaining} attempt remaining.",
    incorrect_pin_many: "Incorrect PIN. {remaining} attempts remaining.",
    decryption_failed: "Decryption failed. Data may be corrupted.",
    error_try_again: "An error occurred. Please try again.",

    // Forgot PIN / reset
    forgot_pin_title: "Forgot PIN?",
    forgot_pin_msg:
      "This will permanently erase all your cycle data and reset My Cycle Keeper. This cannot be undone. Are you sure?",
    forgot_pin_confirm: "Yes, erase and reset",
    reset_complete_title: "Reset Complete",
    reset_complete_msg:
      "My Cycle Keeper has been reset. Please set a new PIN to get started.",
    reset_failed_title: "Reset Failed",
    reset_failed_msg:
      "Could not clear your data. Please refresh the page and try again.",

    // Save / setup
    save_failed_title: "Save Failed",
    save_failed_msg: "Could not save your data. Please try again.",
    missing_date_title: "Missing Date",
    missing_date_msg: "Please enter the first day of your last period.",
    set_pin_title: "Set a PIN",
    set_pin_msg: "Enter a 4-digit PIN to protect your data.",
    setup_error_title: "Setup Error",
    setup_error_msg:
      "Could not complete setup. Please refresh the page and try again.",

    // Note
    note_count: "{count} / 500",
    note_placeholder: "Add a note…",

    // Symptom modals
    set_flow: "Set Flow",
    save: "Save",
    cancel: "Cancel",
    ok: "OK",
    refresh: "Refresh",
    pain_label: "Pain {value} / 10",
    set_pain: "Set Pain",
    mood_low: "Low Mood",
    mood_happy: "Happy",
    mood_neutral: "Neutral",
    set_mood: "Set Mood",

    // Reminder banner
    period_expected_in_one: "Period expected in {n} day",
    period_expected_in_many: "Period expected in {n} days",

    // Phase messages
    phase_menstruation: "Your period 🩸",
    phase_follicular: "Building up ✨",
    phase_fertile: "Fertile days 🌿",
    phase_ovulation: "Ovulation day 🌟",
    phase_luteal: "Luteal phase 🌙",

    // Phase subtitles
    subtitle_menstruation: "Day {day} of your period",
    subtitle_fertile: "Days {start}–{end} are fertile",
    subtitle_ovulation: "Peak fertility today",
    subtitle_other: "Next period in {n} days",

    // Status card – period info
    status_cycle_day_of: "Day {day} of your {total}-day cycle",
    status_period_today: "Your period is expected today",
    status_period_soon_date: "May start today or around {date}",
    status_period_in_date: "Next period expected around {date}",

    // Status card
    now: "Now",
    bar_day: "Day {n}",

    // History / insights
    cycle_history_empty:
      "Log at least 2 period start dates to see cycle history.",
    history_days_one: "{n} day",
    history_days_many: "{n} days",
    no_data_yet: "No tracking data logged yet",

    // Chart labels
    chart_full_year: "Full Year {year}",
    chart_month_year: "{month} {year}",

    // Chart download errors
    download_failed_title: "Download Failed",
    download_failed_msg: "Could not download chart. Please try again.",

    // Settings validation
    invalid_date_title: "Invalid Date",
    invalid_date_msg: "Please enter a valid last period date.",
    invalid_cycle_title: "Invalid Cycle Length",
    invalid_cycle_msg: "Cycle length must be between 20 and 45 days.",
    invalid_duration_title: "Invalid Duration",
    invalid_duration_msg: "Period duration must be between 1 and 10 days.",
    update_predictions_title: "Update Predictions?",
    update_predictions_msg:
      "This will recalculate all cycle predictions based on your new settings. Your logged symptoms and notes will remain unchanged. Continue?",
    update_predictions_confirm: "Yes, Update",

    // Backup status
    backup_never: "Last backup: Never",
    backup_today: "Last backup: Today",
    backup_yesterday: "Last backup: Yesterday",
    backup_days_ago_one: "Last backup: {n} day ago",
    backup_days_ago_many: "Last backup: {n} days ago",
    backup_overdue_one: "Last backup: {n} day ago — overdue!",
    backup_overdue_many: "Last backup: {n} days ago — overdue!",

    // Export/import
    export_backup_title: "Export Backup",
    export_backup_msg:
      "Your backup will be exported as an encrypted file. It can only be decrypted with your PIN. Keep it private.",
    export: "Export",
    export_failed_title: "Export Failed",
    export_failed_msg: "Could not export backup. Please try again.",
    enter_backup_pin_title: "Enter Backup PIN",
    enter_backup_pin_msg:
      "Enter the PIN that was active when this backup was created.",
    incorrect_pin_simple: "Incorrect PIN. Try again.",
    restored_title: "Restored",
    restored_msg: "Your backup has been restored successfully.",
    invalid_backup_title: "Invalid Backup",
    invalid_backup_msg: "This backup format is not supported.",
    import_failed_title: "Import Failed",
    import_failed_msg: "Could not read backup file. Ensure it's valid.",

    // Storage info
    storage_used: "{sizeKB} KB (IndexedDB)",
    storage_unknown: "Unknown",

    // Erase data
    erase_title: "Erase All Data",
    erase_msg:
      "This will permanently delete all your cycle data and cannot be undone. Are you absolutely sure?",
    erase_confirm: "Yes, erase everything",
    erase_failed_title: "Erase Failed",
    erase_failed_msg: "Could not erase data. Please try again.",

    // Change PIN
    confirm_new_pin: "Confirm New PIN",
    enter_new_pin: "Enter New PIN",
    reenter_pin_msg: "Re-enter your new PIN to confirm.",
    choose_pin_msg: "Choose a 4-digit PIN.",
    pins_no_match: "PINs don't match. Try again.",
    pin_changed_title: "PIN Changed",
    pin_changed_msg:
      "Your PIN has been updated and all data re-encrypted.\n\nNote: any backups made before this change will still require your old PIN to restore.",
    pin_change_failed_title: "PIN Change Failed",
    pin_change_failed_msg: "Could not update PIN. Please try again.",

    // Calendar aria-labels
    calendar_day_period: "period day",
    calendar_day_ovulation: "ovulation day",
    calendar_day_fertile: "fertile day",
    calendar_day_regular: "regular day",
    calendar_day_period_possible: "possible period day",

    // Statistical cycle tracking (shown in Insights once 3+ cycles tracked)
    stat_std_dev: "Std Deviation",
    stat_range: "Cycle Range",
    stat_prediction_window: "Prediction Window",
    stat_regularity: "Regularity",
    stat_regular: "Regular",
    stat_variable: "Variable",

    // Phase badge labels (short, uppercase-safe)
    follicular: "Follicular",

    // Auto-fill setting
    settings_autofill_label: "Auto-fill period days",
    settings_autofill_hint: "Days to auto-fill with light flow after the first day of a new period. Set to 0 to disable.",
    autofill_banner_msg_one: "Auto-filled {n} day ahead with light flow.",
    autofill_banner_msg_many: "Auto-filled {n} days ahead with light flow.",
    autofill_banner_settings: "Adjust in Settings",
    autofill_banner_backup_pre: "Reminder to ",
    autofill_banner_backup: "back up",

    // Theme picker
    settings_theme_label: "Theme",
    theme_default: "YCK Classic",
    theme_light: "Newsroom Light",
    theme_dark: "Newsroom Dark",
    theme_kawaii: "Pink Power 🌸",

    // Language switcher
    language_label: "Language",
    lang_en: "English",
    lang_ru: "Русский",
    lang_es: "Español",
    lang_ja: "日本語",
    lang_zh_tw: "繁體中文",

    // Nav tabs
    nav_calendar: "Calendar",
    nav_insights: "Insights",
    nav_settings: "Settings",
    nav_about: "About",

    // Settings HTML labels
    settings_cycle_tab: "Cycle Settings",
    settings_layout_tab: "Layout",
    settings_security_tab: "Security & Privacy",
    settings_calendar_display: "Calendar",
    settings_cycle_section: "Cycle Settings",
    settings_last_period: "Last period start date",
    settings_cycle_length: "Average cycle length (days)",
    settings_period_duration: "Period duration (days)",
    settings_update_btn: "Update Predictions",
    settings_tolerance: "Prediction tolerance (days)",
    settings_tolerance_hint: "Days shown before/after each predicted period in the calendar. Leave blank to use auto (based on your cycle regularity).",
    save: "Save",
    settings_show_fertility: "Show fertile window in calendar",
    settings_security_section: "Security & Privacy",
    settings_change_pin: "Change PIN",
    settings_export: "Export Encrypted Backup",
    settings_import: "Import Encrypted Backup",
    settings_import_drip: "Import from drip (CSV)",

    // drip CSV import flow
    drip_import_title: "Import from drip",
    drip_import_found: "Found {days} days of data including {periods} flow days. How would you like to import?",
    drip_import_merge: "Merge (keep my data)",
    drip_import_replace: "Replace (use drip data)",
    drip_import_done_title: "Import Complete",
    drip_import_done_msg: "{days} days imported successfully.",
    drip_import_failed_title: "Import Failed",
    drip_import_failed_msg: "Could not read the file. Make sure it is a drip CSV export.",
    drip_import_empty_title: "Nothing to Import",
    drip_import_empty_msg: "The file contained no usable data.",
    settings_storage_label: "Storage used:",
    settings_storage_calculating: "Calculating...",
    settings_erase: "Erase All Data",

    // Onboarding
    onboard_sub: "Track Your Period and Cycle Privately",
    onboard_tagline:
      "Track your flow, mood, and symptoms — all on your device. Free, ad-free, fully accessible, and privacy-first.",
    beta_label: "Beta",
    beta_warning_text:
      "This app is currently in active development. Features may change and bugs may occur.",
    ob_last_period: "First day of your last period",
    ob_cycle_len: "Average cycle length (days)",
    ob_period_dur: "Average period duration (days)",
    pin_setup_title: "🔒 Set a 4-digit PIN",
    pin_setup_sub_1: "Your PIN encrypts all data locally.",
    pin_setup_sub_2: "My Cycle Keeper never sends data anywhere.",
    pin_setup_sub_3: "If you forget your PIN, data will be erased.",
    onboard_start_btn: "Start Tracking ✨",
    privacy_note_aes: "AES-256-GCM encrypted.",
    privacy_note_rest:
      "Data never leaves your device. No accounts, no tracking, forever free.",
    timeout_before: "⏱️ Session expires in",
    timeout_after: "s of inactivity — tap to reset",

    // Flow labels
    flow_light: "Light",
    flow_medium: "Medium",
    flow_heavy: "Heavy",

    // Toast messages
    settings_saved_toast: "Settings saved",
    status_no_data_hint:
      "Start recording your period to see statistics.",
    status_import_hint: "or import your data",

    // Storage full error
    storage_full_title: "Storage Full",
    storage_full_msg:
      "Your device storage is full. Please export your data or clear some logs to free up space.",

    // Forgot PIN second confirmation
    forgot_pin_confirm2_title: "Last Warning",
    forgot_pin_confirm2_msg:
      "ALL your period tracking data will be permanently deleted and cannot be recovered. This cannot be undone.",
    forgot_pin_confirm2_btn: "Yes, Delete Everything",

    // Cycle history
    no_cycle_history:
      "No cycle history yet. Log at least 2 periods to see history.",
    history_showing: "Showing last {shown} of {total} cycles",
    predictions_tab: "Upcoming Periods",
    predictions_empty: "Log at least one period start date to see predictions.",
    history_col_start: "Start",
    history_col_end: "End",
    history_col_period: "Period",
    history_col_cycle: "Cycle",
    view_all_history: "View all",

    // History legend
    legend_short: "Short (<26d)",
    legend_normal: "Normal (26–32d)",
    legend_long: "Long (>32d)",

    // Hardcoded HTML sections
    flow_question: "What's your flow today? 🌊",
    security_info:
      "All data is encrypted with your PIN before being stored. Cycle Keeper uses the <strong>Web Crypto API</strong> — the same standard used by browsers for HTTPS.<br><br>Zero data is sent to any server. No accounts. No analytics.",
    data_persistence:
      '⚠️ <strong>Data Persistence:</strong> Your data is stored in IndexedDB. Clearing browser cache is safe, but clearing "site data" or "cookies and site data" in your browser settings WILL erase all your cycle data. Always export a backup first!',
    about_info_html:
      'Your Cycle Keeper is free software built with care for privacy. Based on the <strong>Calendar Rhythm Method</strong> and <strong>Standard Days Method</strong> for cycle estimation. For informational purposes only.<br><br><strong>Version:</strong> 1.0.0-beta<br><strong>License:</strong> GNU General Public License v3.0<br><strong>Developer:</strong> <a href="https://github.com/pythonime-lab" target="_blank" rel="noopener" class="accessibility-link">pythonime-lab</a><br><br>Found a bug or have a suggestion? Visit our <a href="https://github.com/pythonime-lab/yourcyclekeeper" target="_blank" rel="noopener" class="accessibility-link">GitHub repository</a>.',
    support_info:
      "My Cycle Keeper is <strong>free forever</strong> with no ads, no tracking, and no data collection. If you find it helpful and would like to support continued development, you can buy me a coffee!",
    support_via: "Support via",
    support_footer:
      "Your support helps keep this project maintained and ad-free for everyone. Thank you! 💜",
    privacy_info_html:
      "My Cycle Keeper collects <strong>zero data</strong>. This app:<br>&nbsp;• Stores all data locally on your device only<br>&nbsp;• Has no servers, no accounts, no cloud storage<br>&nbsp;• Has no analytics, no tracking, no telemetry<br>&nbsp;• Has no ads, no third-party code<br>&nbsp;• Never transmits any data anywhere<br>&nbsp;• Is encrypted with your PIN via AES-256-GCM<br><br>Your health data is yours alone.",
    disclaimer_info_html:
      "⚠️ <strong>This app provides cycle estimations based on average biological patterns.</strong> It is <em>not</em> medical advice and must not be used as a substitute for professional medical consultation.<br><br>My Cycle Keeper predicts your cycle by tracking patterns and estimating ovulation timing. Actual cycle timing can vary due to stress, illness, medications, and many other factors.<br><br>Do <strong>not</strong> use this app as a contraceptive or fertility guarantee. Always consult a qualified healthcare professional for medical decisions.",
    accessibility_info_html:
      'My Cycle Keeper follows <strong>WCAG 2.0 accessibility standards</strong>:<br><br>&nbsp;• <strong>Tab/Shift+Tab:</strong> Navigate forward/backward through all interactive elements<br>&nbsp;• <strong>Arrow Keys:</strong> Navigate calendar dates (complex grid component)<br>&nbsp;• <strong>Enter/Space:</strong> Activate buttons and links<br>&nbsp;• <strong>Escape:</strong> Close modals and return focus to trigger element<br>&nbsp;• <strong>PIN Entry:</strong> Type digits 0-9 and Backspace on all PIN screens<br>&nbsp;• <strong>Form Controls:</strong> Native keyboard support for inputs, selects, and textareas<br>&nbsp;• <strong>Screen Readers:</strong> Semantic HTML with proper ARIA labels and roles<br>&nbsp;• <strong>Focus Management:</strong> Visible focus indicators, logical tab order<br><br>Standards based on <a href="https://trailhead.salesforce.com/content/learn/modules/coding-for-web-accessibility/understand-accessible-navigation" target="_blank" rel="noopener" class="accessibility-link">Salesforce Accessibility Guidelines</a>.',
  },

  // ── Russian ────────────────────────────────────────────────────────────────
  ru: {
    storage_error_title: "Ошибка хранилища",
    storage_error_msg:
      "Не удалось получить доступ к хранилищу. Пожалуйста, обновите страницу.",
    db_error_title: "Ошибка базы данных",
    db_error_msg:
      "Не удалось инициализировать хранилище. Пожалуйста, обновите страницу.",

    cycle_stats: "Статистика цикла",
    avg_length: "Средняя длина",
    cycles_logged: "Отмечено циклов",
    avg_period: "Средняя менстр.",
    fertile_days: "Фертильные дни",
    symptom_tracking: "Отслеживание симптомов",
    period: "Менструация",
    ovulation: "Овуляция",
    flow: "Выделения",
    pain: "Боль",
    mood: "Настроение",
    how_it_works: "Как это работает",
    how_it_works_p1:
      "My Cycle Keeper оценивает ваше фертильное окно, отслеживая паттерны цикла. Овуляция оценивается ~ за 14 дней до следующей менструации. Фертильные дни рассчитываются по формуле: день 8 — (длина цикла − 11).",
    how_it_works_p2:
      "При регулярном цикле в 28 дней это означает, что дни с 8 по 17 обычно являются фертильными с овуляцией примерно на 14 день.",
    disclaimer: "Отказ от ответственности",
    estimation_disclaimer:
      "⚠️ Это только инструмент для оценки. Не для контрацепции. Стресс, болезни и лекарства могут изменить сроки.",
    no_symptoms_logged:
      "Симптомы пока не отмечены — начните отмечать их сегодня",
    cycle_history: "История цикла",
    all_months: "Все месяцы",
    cycle_day: "День цикла",
    until_next: "До следующей",
    day_1: "День 1",
    avg_length_short: "Ср. длина",
    period_short: "Менструация",
    fertile: "Фертильные",
    ovulation_short: "Овуляция",
    luteal: "Лютеиновая",

    unlock_subtitle: "Введите PIN для разблокировки личных данных о здоровье",
    too_many_attempts: "Слишком много попыток. Повторите через {secs}с.",
    locked_out: "🚫 Слишком много попыток. Заблокировано на 60 секунд.",
    lockout_ended: "Блокировка снята. Повторите попытку.",
    incorrect_pin_one: "Неверный PIN. Осталась {remaining} попытка.",
    incorrect_pin_few: "Неверный PIN. Осталось {remaining} попытки.",
    incorrect_pin_many: "Неверный PIN. Осталось {remaining} попыток.",
    decryption_failed: "Ошибка расшифровки. Данные могут быть повреждены.",
    error_try_again: "Произошла ошибка. Пожалуйста, попробуйте снова.",

    forgot_pin_title: "Забыли PIN?",
    forgot_pin_msg:
      "Это действие безвозвратно удалит все данные о цикле и сбросит My Cycle Keeper. Это нельзя отменить. Вы уверены?",
    forgot_pin_confirm: "Да, удалить и сбросить",
    reset_complete_title: "Сброс выполнен",
    reset_complete_msg:
      "My Cycle Keeper был сброшен. Пожалуйста, установите новый PIN для начала работы.",
    reset_failed_title: "Ошибка сброса",
    reset_failed_msg:
      "Не удалось удалить данные. Пожалуйста, обновите страницу и попробуйте снова.",

    save_failed_title: "Ошибка сохранения",
    save_failed_msg:
      "Не удалось сохранить данные. Пожалуйста, попробуйте снова.",
    missing_date_title: "Дата не указана",
    missing_date_msg: "Пожалуйста, введите первый день последней менструации.",
    set_pin_title: "Установите PIN",
    set_pin_msg: "Введите 4-значный PIN для защиты данных.",
    setup_error_title: "Ошибка настройки",
    setup_error_msg:
      "Не удалось завершить настройку. Пожалуйста, обновите страницу и попробуйте снова.",

    note_count: "{count} / 500",

    set_flow: "Интенсивность",
    save: "Сохранить",
    cancel: "Отмена",
    ok: "ОК",
    refresh: "Обновить",
    pain_label: "Боль {value} / 10",
    set_pain: "Боль",
    mood_low: "Плохое настроение",
    mood_happy: "Хорошее настроение",
    mood_neutral: "Нейтральное",
    set_mood: "Настроение",

    period_expected_in_one: "Менструация ожидается через {n} день",
    period_expected_in_few: "Менструация ожидается через {n} дня",
    period_expected_in_many: "Менструация ожидается через {n} дней",

    phase_menstruation: "Ваша менструация 🩸",
    phase_follicular: "Фолликулярная фаза ✨",
    phase_fertile: "Фертильные дни 🌿",
    phase_ovulation: "День овуляции 🌟",
    phase_luteal: "Лютеиновая фаза 🌙",

    subtitle_menstruation: "День {day} вашей менструации",
    subtitle_fertile: "Дни {start}–{end} — фертильные",
    subtitle_ovulation: "Пик фертильности сегодня",
    subtitle_other: "До следующей менструации {n} дней",

    now: "Сейчас",
    bar_day: "День {n}",

    cycle_history_empty:
      "Отметьте не менее 2 начал менструации, чтобы увидеть историю цикла.",
    history_days_one: "{n} день",
    history_days_few: "{n} дня",
    history_days_many: "{n} дней",
    no_data_yet: "Данные ещё не добавлены",

    chart_full_year: "Весь {year} год",
    chart_month_year: "{month} {year}",

    download_failed_title: "Ошибка загрузки",
    download_failed_msg:
      "Не удалось скачать график. Пожалуйста, попробуйте снова.",

    invalid_date_title: "Неверная дата",
    invalid_date_msg:
      "Пожалуйста, введите корректную дату последней менструации.",
    invalid_cycle_title: "Неверная длина цикла",
    invalid_cycle_msg: "Длина цикла должна быть от 20 до 45 дней.",
    invalid_duration_title: "Неверная продолжительность",
    invalid_duration_msg:
      "Продолжительность менструации должна быть от 1 до 10 дней.",
    update_predictions_title: "Обновить прогнозы?",
    update_predictions_msg:
      "Это пересчитает все прогнозы цикла на основе новых настроек. Записи симптомов и заметки останутся без изменений. Продолжить?",
    update_predictions_confirm: "Да, обновить",

    backup_never: "Резервная копия: никогда",
    backup_today: "Резервная копия: сегодня",
    backup_yesterday: "Резервная копия: вчера",
    backup_days_ago_one: "Резервная копия: {n} день назад",
    backup_days_ago_few: "Резервная копия: {n} дня назад",
    backup_days_ago_many: "Резервная копия: {n} дней назад",
    backup_overdue_one: "Резервная копия: {n} день назад — устарела!",
    backup_overdue_few: "Резервная копия: {n} дня назад — устарела!",
    backup_overdue_many: "Резервная копия: {n} дней назад — устарела!",

    export_backup_title: "Экспорт резервной копии",
    export_backup_msg:
      "Резервная копия будет экспортирована в зашифрованном файле. Расшифровать её можно только с помощью вашего PIN. Храните в безопасном месте.",
    export: "Экспортировать",
    export_failed_title: "Ошибка экспорта",
    export_failed_msg:
      "Не удалось экспортировать резервную копию. Пожалуйста, попробуйте снова.",
    enter_backup_pin_title: "Введите PIN резервной копии",
    enter_backup_pin_msg:
      "Введите PIN, который использовался при создании этой резервной копии.",
    incorrect_pin_simple: "Неверный PIN. Попробуйте снова.",
    restored_title: "Восстановлено",
    restored_msg: "Резервная копия успешно восстановлена.",
    invalid_backup_title: "Неверный формат резервной копии",
    invalid_backup_msg: "Этот формат резервной копии не поддерживается.",
    import_failed_title: "Ошибка импорта",
    import_failed_msg:
      "Не удалось прочитать файл резервной копии. Убедитесь в его корректности.",

    storage_used: "{sizeKB} КБ (IndexedDB)",
    storage_unknown: "Неизвестно",

    erase_title: "Удалить все данные",
    erase_msg:
      "Это безвозвратно удалит все данные о цикле. Вы абсолютно уверены?",
    erase_confirm: "Да, удалить всё",
    erase_failed_title: "Ошибка удаления",
    erase_failed_msg:
      "Не удалось удалить данные. Пожалуйста, попробуйте снова.",

    confirm_new_pin: "Подтвердите новый PIN",
    enter_new_pin: "Введите новый PIN",
    reenter_pin_msg: "Введите новый PIN ещё раз для подтверждения.",
    choose_pin_msg: "Выберите 4-значный PIN.",
    pins_no_match: "PIN-коды не совпадают. Попробуйте снова.",
    pin_changed_title: "PIN изменён",
    pin_changed_msg:
      "Ваш PIN обновлён, все данные перешифрованы.\n\nПримечание: для восстановления резервных копий, созданных до этого изменения, потребуется старый PIN.",
    pin_change_failed_title: "Ошибка смены PIN",
    pin_change_failed_msg:
      "Не удалось обновить PIN. Пожалуйста, попробуйте снова.",

    calendar_day_period: "день менструации",
    calendar_day_ovulation: "день овуляции",
    calendar_day_fertile: "фертильный день",
    calendar_day_regular: "обычный день",

    follicular: "Фолликулярная",

    about_tab_developer: "Разработчик",
    about_tab_privacy: "Приватность",
    about_tab_disclaimer: "Отказ от ответственности",
    language_label: "Язык",
    lang_en: "English",
    lang_ru: "Русский",
    lang_es: "Español",
    lang_ja: "日本語",
    lang_zh_tw: "繁體中文",

    settings_cycle_tab: "Настройки цикла",
    settings_layout_tab: "Интерфейс",
    settings_security_tab: "Безопасность",
    settings_calendar_display: "Календарь",
    settings_cycle_section: "Настройки цикла",
    settings_last_period: "Дата начала последней менструации",
    settings_cycle_length: "Средняя длина цикла (дни)",
    settings_period_duration: "Продолжительность менструации (дни)",
    settings_update_btn: "Обновить прогнозы",
    settings_security_section: "Безопасность и конфиденциальность",
    settings_change_pin: "Изменить PIN",
    settings_export: "Экспортировать резервную копию",
    settings_import: "Импортировать резервную копию",
    settings_storage_label: "Использовано памяти:",
    settings_storage_calculating: "Вычисляется...",
    settings_erase: "Удалить все данные",

    // Onboarding
    onboard_sub: "Отслеживайте цикл приватно",
    onboard_tagline:
      "Следите за выделениями, настроем и симптомами — всё на вашем устройстве. Бесплатно, без рекламы, с заботой о конфиденциальности.",
    beta_label: "Бета",
    beta_warning_text:
      "Приложение находится в активной разработке. Возможны изменения функций и ошибки.",
    ob_last_period: "Первый день последней менструации",
    ob_cycle_len: "Средняя длина цикла (дни)",
    ob_period_dur: "Средняя длительность менструации (дни)",
    pin_setup_title: "🔒 Задайте 4-значный PIN",
    pin_setup_sub_1: "Ваш PIN шифрует все данные локально.",
    pin_setup_sub_2: "My Cycle Keeper никогда не отправляет данные.",
    pin_setup_sub_3: "Если вы забудете PIN, данные будут удалены.",
    onboard_start_btn: "Начать отслеживание ✨",
    privacy_note_aes: "Шифрование AES-256-GCM.",
    privacy_note_rest:
      "Данные не покидают ваше устройство. Без аккаунтов, без слежки, навсегда бесплатно.",
    timeout_before: "⏱️ Сессия истекает через",
    timeout_after: "с бездействия — нажмите для сброса",

    // Flow labels
    flow_light: "Слабые",
    flow_medium: "Умеренные",
    flow_heavy: "Обильные",

    // Toast messages
    settings_saved_toast: "Настройки сохранены",
    status_no_data_hint:
      "Начните записывать менструацию, чтобы увидеть статистику.",
    status_import_hint: "или импортируйте данные",

    // Storage full error
    storage_full_title: "Хранилище заполнено",
    storage_full_msg:
      "Хранилище устройства заполнено. Экспортируйте данные или удалите некоторые записи.",

    // Forgot PIN second confirmation
    forgot_pin_confirm2_title: "Последнее предупреждение",
    forgot_pin_confirm2_msg:
      "ВСЕ ваши данные отслеживания цикла будут безвозвратно удалены. Это действие нельзя отменить.",
    forgot_pin_confirm2_btn: "Да, удалить всё",

    // Cycle history
    no_cycle_history:
      "История циклов пока отсутствует. Зафиксируйте хотя бы 2 менструации.",
    history_showing: "Показано последних {shown} из {total} циклов",

    // History legend
    legend_short: "Короткий (<26д)",
    legend_normal: "Нормальный (26–32д)",
    legend_long: "Длинный (>32д)",
  },

  // ── Belarusian (inactive — translations preserved for future use) ───────────
  be: {
    storage_error_title: "Памылка сховішча",
    storage_error_msg:
      "Не ўдалося атрымаць доступ да сховішча. Калі ласка, абнавіце старонку.",
    db_error_title: "Памылка базы даных",
    db_error_msg:
      "Не ўдалося ініцыялізаваць сховішча. Калі ласка, абнавіце старонку.",

    unlock_subtitle:
      "Увядзіце PIN для разблакавання асабістых даных аб здароўі",
    too_many_attempts: "Занадта шмат спроб. Паўтарыце праз {secs}с.",
    locked_out: "🚫 Занадта шмат спроб. Заблакавана на 60 секунд.",
    lockout_ended: "Блакаванне зняты. Паўтарыце спробу.",
    incorrect_pin_one: "Няслушны PIN. Засталася {remaining} спроба.",
    incorrect_pin_few: "Няслушны PIN. Засталося {remaining} спробы.",
    incorrect_pin_many: "Няслушны PIN. Засталося {remaining} спроб.",
    decryption_failed: "Памылка дэшыфравання. Даныя могуць быць пашкоджаны.",
    error_try_again: "Адбылася памылка. Калі ласка, паўтарыце спробу.",

    forgot_pin_title: "Забылі PIN?",
    forgot_pin_msg:
      "Гэта назаўжды выдаліць усе даныя пра цыкл і скіне My Cycle Keeper. Гэта нельга адмяніць. Вы ўпэўнены?",
    forgot_pin_confirm: "Так, выдаліць і скінуць",
    reset_complete_title: "Скід выкананы",
    reset_complete_msg:
      "My Cycle Keeper быў скінуты. Калі ласка, усталюйце новы PIN для пачатку працы.",
    reset_failed_title: "Памылка скіду",
    reset_failed_msg:
      "Не ўдалося выдаліць даныя. Калі ласка, абнавіце старонку і паўтарыце спробу.",

    save_failed_title: "Памылка захавання",
    save_failed_msg: "Не ўдалося захаваць даныя. Калі ласка, паўтарыце спробу.",
    missing_date_title: "Дата не ўказана",
    missing_date_msg: "Калі ласка, увядзіце першы дзень апошняй менструацыі.",
    set_pin_title: "Усталюйце PIN",
    set_pin_msg: "Увядзіце 4-значны PIN для абароны даных.",
    setup_error_title: "Памылка наладкі",
    setup_error_msg:
      "Не ўдалося завяршыць наладку. Калі ласка, абнавіце старонку і паўтарыце спробу.",

    note_count: "{count} / 500",

    set_flow: "Інтэнсіўнасць",
    save: "Захаваць",
    cancel: "Адмена",
    ok: "ОК",
    refresh: "Абнавіць",
    pain_label: "Боль {value} / 10",
    set_pain: "Боль",
    mood_low: "Дрэнны настрой",
    mood_happy: "Добры настрой",
    mood_neutral: "Нейтральны",
    set_mood: "Настрой",

    period_expected_in_one: "Ваша менструацыя чакаецца праз {n} дзень",
    period_expected_in_few: "Ваша менструацыя чакаецца праз {n} дні",
    period_expected_in_many: "Ваша менструацыя чакаецца праз {n} дзён",

    phase_menstruation: "Ваша менструацыя 🩸",
    phase_follicular: "Фалікулярная фаза ✨",
    phase_fertile: "Фертыльныя дні 🌿",
    phase_ovulation: "Дзень авуляцыі 🌟",
    phase_luteal: "Лютэінавая фаза 🌙",

    subtitle_menstruation: "Дзень {day} вашай менструацыі",
    subtitle_fertile: "Дні {start}–{end} — фертыльныя",
    subtitle_ovulation: "Пік фертыльнасці сёння",
    subtitle_other: "Да наступнай менструацыі {n} дзён",

    now: "Зараз",
    bar_day: "Дзень {n}",

    cycle_history_empty:
      "Адзначце не менш за 2 пачаткі менструацыі, каб убачыць гісторыю цыкла.",
    history_days_one: "{n} дзень",
    history_days_few: "{n} дні",
    history_days_many: "{n} дзён",
    no_data_yet: "Даныя яшчэ не дададзены",

    chart_full_year: "Увесь {year} год",
    chart_month_year: "{month} {year}",

    download_failed_title: "Памылка загрузкі",
    download_failed_msg:
      "Не ўдалося спампаваць графік. Калі ласка, паўтарыце спробу.",

    invalid_date_title: "Няслушная дата",
    invalid_date_msg:
      "Калі ласка, увядзіце карэктную дату апошняй менструацыі.",
    invalid_cycle_title: "Няслушная даўжыня цыкла",
    invalid_cycle_msg: "Даўжыня цыкла мусіць быць ад 20 да 45 дзён.",
    invalid_duration_title: "Няслушная працягласць",
    invalid_duration_msg:
      "Працягласць менструацыі мусіць быць ад 1 да 10 дзён.",
    update_predictions_title: "Абнавіць прагнозы?",
    update_predictions_msg:
      "Гэта пераразлічыць усе прагнозы цыкла на аснове новых налад. Запісы сімптомаў і нататкі застануцца без змен. Працягнуць?",
    update_predictions_confirm: "Так, абнавіць",

    backup_never: "Рэзервовая копія: ніколі",
    backup_today: "Рэзервовая копія: сёння",
    backup_yesterday: "Рэзервовая копія: учора",
    backup_days_ago_one: "Рэзервовая копія: {n} дзень таму",
    backup_days_ago_few: "Рэзервовая копія: {n} дні таму",
    backup_days_ago_many: "Рэзервовая копія: {n} дзён таму",
    backup_overdue_one: "Рэзервовая копія: {n} дзень таму — пратэрмінавана!",
    backup_overdue_few: "Рэзервовая копія: {n} дні таму — пратэрмінавана!",
    backup_overdue_many: "Рэзервовая копія: {n} дзён таму — пратэрмінавана!",

    export_backup_title: "Экспарт рэзервовай копіі",
    export_backup_msg:
      "Рэзервовая копія будзе экспартавана ў зашыфраваным файле. Расшыфраваць яе можна толькі з дапамогай вашага PIN. Захоўвайце ў бяспечным месцы.",
    export: "Экспартаваць",
    export_failed_title: "Памылка экспарту",
    export_failed_msg:
      "Не ўдалося экспартаваць рэзервовую копію. Калі ласка, паўтарыце спробу.",
    enter_backup_pin_title: "Увядзіце PIN рэзервовай копіі",
    enter_backup_pin_msg:
      "Увядзіце PIN, які выкарыстоўваўся пры стварэнні гэтай рэзервовай копіі.",
    incorrect_pin_simple: "Няслушны PIN. Паўтарыце спробу.",
    restored_title: "Адноўлена",
    restored_msg: "Рэзервовая копія паспяхова адноўлена.",
    invalid_backup_title: "Няслушны фармат рэзервовай копіі",
    invalid_backup_msg: "Гэты фармат рэзервовай копіі не падтрымліваецца.",
    import_failed_title: "Памылка імпарту",
    import_failed_msg:
      "Не ўдалося прачытаць файл рэзервовай копіі. Пераканайцеся ў яго карэктнасці.",

    storage_used: "{sizeKB} КБ (IndexedDB)",
    storage_unknown: "Невядома",

    erase_title: "Выдаліць усе даныя",
    erase_msg:
      "Гэта назаўжды выдаліць усе даныя пра цыкл. Вы абсалютна ўпэўнены?",
    erase_confirm: "Так, выдаліць усё",
    erase_failed_title: "Памылка выдалення",
    erase_failed_msg:
      "Не ўдалося выдаліць даныя. Калі ласка, паўтарыце спробу.",

    confirm_new_pin: "Пацвердзіце новы PIN",
    enter_new_pin: "Увядзіце новы PIN",
    reenter_pin_msg: "Увядзіце новы PIN яшчэ раз для пацверджання.",
    choose_pin_msg: "Выберыце 4-значны PIN.",
    pins_no_match: "PIN-коды не супадаюць. Паўтарыце спробу.",
    pin_changed_title: "PIN зменены",
    pin_changed_msg:
      "Ваш PIN абноўлены, усе даныя перашыфраваны.\n\nЗаўвага: для аднаўлення рэзервовых копій, створаных да гэтай змены, спатрэбіцца стары PIN.",
    pin_change_failed_title: "Памылка змены PIN",
    pin_change_failed_msg:
      "Не ўдалося абнавіць PIN. Калі ласка, паўтарыце спробу.",

    calendar_day_period: "дзень менструацыі",
    calendar_day_ovulation: "дзень авуляцыі",
    calendar_day_fertile: "фертыльны дзень",
    calendar_day_regular: "звычайны дзень",

    follicular: "Фалікулярная",

    about_tab_developer: "Распрацоўшчык",
    about_tab_privacy: "Прыватнасць",
    about_tab_disclaimer: "Адмова ад адказнасці",
    language_label: "Мова",
    lang_en: "English",
    lang_ru: "Русский",
    lang_be: "Беларуская",
    lang_es: "Español",
    lang_ja: "日本語",
    lang_zh_tw: "繁體中文",

    settings_cycle_tab: "Налады цыкла",
    settings_layout_tab: "Інтэрфейс",
    settings_security_tab: "Бяспека",
    settings_calendar_display: "Каляндар",
    settings_cycle_section: "Налады цыкла",
    settings_last_period: "Дата пачатку апошняй менструацыі",
    settings_cycle_length: "Сярэдняя даўжыня цыкла (дні)",
    settings_period_duration: "Працягласць менструацыі (дні)",
    settings_update_btn: "Абнавіць прагнозы",
    settings_security_section: "Бяспека і прыватнасць",
    settings_change_pin: "Змяніць PIN",
    settings_export: "Экспартаваць рэзервовую копію",
    settings_import: "Імпартаваць рэзервовую копію",
    settings_storage_label: "Выкарыстана памяці:",
    settings_storage_calculating: "Вылічваецца...",
    settings_erase: "Выдаліць усе даныя",

    // Onboarding
    onboard_sub: "Адсочвайце цыкл прыватна",
    onboard_tagline:
      "Сачыце за выдзяленнямі, настроем і сімптомамі — усё на вашай прыладзе. Бясплатна, без рэкламы, з клопатам аб прыватнасці.",
    beta_label: "Бэта",
    beta_warning_text:
      "Праграма знаходзіцца ў актыўнай распрацоўцы. Магчымы змены функцый і памылкі.",
    ob_last_period: "Першы дзень апошняй менструацыі",
    ob_cycle_len: "Сярэдняя даўжыня цыкла (дні)",
    ob_period_dur: "Сярэдняя працягласць менструацыі (дні)",
    pin_setup_title: "🔒 Задаць 4-значны PIN",
    pin_setup_sub_1: "Ваш PIN шыфруе ўсе даныя лакальна.",
    pin_setup_sub_2: "My Cycle Keeper ніколі не адпраўляе даныя.",
    pin_setup_sub_3: "Калі вы забудзецеся PIN, даныя будуць выдалены.",
    onboard_start_btn: "Пачаць адсочванне ✨",
    privacy_note_aes: "Шыфраванне AES-256-GCM.",
    privacy_note_rest:
      "Даныя не пакідаюць вашу прыладу. Без акаўнтаў, без сачэння, назаўжды бясплатна.",
    timeout_before: "⏱️ Сесія заканчваецца праз",
    timeout_after: "с бяздзейнасці — націсніце для скіду",

    // Flow labels
    flow_light: "Слабыя",
    flow_medium: "Умераныя",
    flow_heavy: "Абутныя",

    // Toast messages
    settings_saved_toast: "Налады захаваны",
    status_no_data_hint:
      "Пачніце запісваць цыкл, каб убачыць статыстыку.",
    status_import_hint: "або імпартуйце даныя",

    // Storage full error
    storage_full_title: "Сховішча запоўнена",
    storage_full_msg:
      "Сховішча прылады запоўнена. Экспартуйце дадзеныя або выдаліце некаторыя запісы.",

    // Forgot PIN second confirmation
    forgot_pin_confirm2_title: "Апошняе папярэджанне",
    forgot_pin_confirm2_msg:
      "УСЕ вашы дадзеныя будуць назаўжды выдалены. Гэта дзеянне немагчыма адмяніць.",
    forgot_pin_confirm2_btn: "Так, выдаліць усё",

    // Cycle history
    no_cycle_history:
      "Гісторыя цыклаў пакуль адсутнічае. Зафіксуйце хаця б 2 менструацыі.",
    history_showing: "Паказана апошніх {shown} з {total} цыклаў",

    // History legend
    legend_short: "Кароткі (<26д)",
    legend_normal: "Нармальны (26–32д)",
    legend_long: "Доўгі (>32д)",
  },

  // ── Spanish ────────────────────────────────────────────────────────────────
  es: {
    storage_error_title: "Error de almacenamiento",
    storage_error_msg:
      "No se pudo acceder al almacenamiento. Por favor, recarga la página.",
    db_error_title: "Error de base de datos",
    cycle_stats: "Estadísticas del ciclo",
    avg_length: "Longitud promedio",
    cycles_logged: "Ciclos registrados",
    avg_period: "Período promedio",
    fertile_days: "Días fértiles",
    symptom_tracking: "Gráfico de síntomas",
    period: "Período",
    ovulation: "Ovulación",
    flow: "Flujo",
    pain: "Dolor",
    mood: "Ánimo",
    how_it_works: "Cómo funciona",
    how_it_works_p1:
      "My Cycle Keeper estima tu ventana fértil rastreando patrones del ciclo. La ovulación se estima ~14 días antes de tu próximo período. Los días fértiles se calculan como el día 8 hasta (longitud del ciclo − 11).",
    how_it_works_p2:
      "Para ciclos regulares de 28 días, esto significa que los días 8–17 suelen ser fértiles, con ovulación alrededor del día 14.",
    disclaimer: "Aviso",
    estimation_disclaimer:
      "⚠️ Esta es solo una herramienta de estimación. No es para anticoncepción. El estrés, las enfermedades y los medicamentos pueden cambiar los tiempos.",
    no_symptoms_logged:
      "Aún no hay síntomas registrados — comienza registrando hoy",
    cycle_history: "Historial del ciclo",
    all_months: "Año",
    cycle_day: "Día del ciclo",
    until_next: "Hasta el próximo",
    day_1: "Día 1",
    avg_length_short: "Longitud promedio",
    period_short: "Período",
    fertile: "Fértil",
    ovulation_short: "Ovulación",
    luteal: "Lútea",
    db_error_msg:
      "No se pudo inicializar el almacenamiento. Por favor, recarga la página.",

    about_tab_developer: "Desarrollador",
    about_tab_privacy: "Privacidad",
    about_tab_disclaimer: "Aviso",
    unlock_subtitle:
      "Ingresa tu PIN para desbloquear tus datos privados de salud",
    too_many_attempts: "Demasiados intentos. Inténtalo en {secs}s.",
    locked_out: "🚫 Demasiados intentos. Bloqueado por 60 segundos.",
    lockout_ended: "Bloqueo finalizado. Inténtalo de nuevo.",
    incorrect_pin_one: "PIN incorrecto. Queda {remaining} intento.",
    incorrect_pin_many: "PIN incorrecto. Quedan {remaining} intentos.",
    decryption_failed: "Error de descifrado. Los datos pueden estar dañados.",
    error_try_again: "Ocurrió un error. Por favor, inténtalo de nuevo.",

    forgot_pin_title: "¿Olvidaste el PIN?",
    forgot_pin_msg:
      "Esto eliminará permanentemente todos tus datos del ciclo y restablecerá My Cycle Keeper. No se puede deshacer. ¿Estás segura?",
    forgot_pin_confirm: "Sí, borrar y restablecer",
    reset_complete_title: "Restablecimiento completado",
    reset_complete_msg:
      "My Cycle Keeper ha sido restablecido. Por favor, establece un nuevo PIN para comenzar.",
    reset_failed_title: "Error al restablecer",
    reset_failed_msg:
      "No se pudieron borrar los datos. Por favor, recarga la página e inténtalo de nuevo.",

    save_failed_title: "Error al guardar",
    save_failed_msg:
      "No se pudieron guardar los datos. Por favor, inténtalo de nuevo.",
    missing_date_title: "Fecha requerida",
    missing_date_msg: "Por favor, ingresa el primer día de tu último período.",
    set_pin_title: "Establece un PIN",
    set_pin_msg: "Ingresa un PIN de 4 dígitos para proteger tus datos.",
    setup_error_title: "Error de configuración",
    setup_error_msg:
      "No se pudo completar la configuración. Por favor, recarga la página e inténtalo de nuevo.",

    note_count: "{count} / 500",
    note_placeholder: "Añadir una nota…",

    set_flow: "Flujo",
    save: "Guardar",
    cancel: "Cancelar",
    ok: "Aceptar",
    refresh: "Recargar",
    pain_label: "Dolor {value} / 10",
    set_pain: "Dolor",
    mood_low: "Ánimo bajo",
    mood_happy: "Feliz",
    mood_neutral: "Neutral",
    set_mood: "Ánimo",

    period_expected_in_one: "Periodo esperado en {n} día",
    period_expected_in_many: "Periodo esperado en {n} días",

    phase_menstruation: "Tu período 🩸",
    phase_follicular: "Fase folicular ✨",
    phase_fertile: "Días fértiles 🌿",
    phase_ovulation: "Día de ovulación 🌟",
    phase_luteal: "Fase lútea 🌙",

    subtitle_menstruation: "Día {day} de tu período",
    subtitle_fertile: "Los días {start}–{end} son fértiles",
    subtitle_ovulation: "Pico de fertilidad hoy",
    subtitle_other: "Próximo período en {n} días",

    now: "Ahora",
    bar_day: "Día {n}",

    cycle_history_empty:
      "Registra al menos 2 fechas de inicio de período para ver el historial del ciclo.",
    history_days_one: "{n} día",
    history_days_many: "{n} días",
    no_data_yet: "Aún no hay datos registrados",

    chart_full_year: "Año completo {year}",
    chart_month_year: "{month} {year}",

    download_failed_title: "Error al descargar",
    download_failed_msg:
      "No se pudo descargar el gráfico. Por favor, inténtalo de nuevo.",

    invalid_date_title: "Fecha inválida",
    invalid_date_msg:
      "Por favor, ingresa una fecha válida para el último período.",
    invalid_cycle_title: "Longitud de ciclo inválida",
    invalid_cycle_msg: "La longitud del ciclo debe estar entre 20 y 45 días.",
    invalid_duration_title: "Duración inválida",
    invalid_duration_msg:
      "La duración del período debe estar entre 1 y 10 días.",
    update_predictions_title: "¿Actualizar predicciones?",
    update_predictions_msg:
      "Esto recalculará todas las predicciones del ciclo con tu nueva configuración. Los síntomas y notas registrados no cambiarán. ¿Continuar?",
    update_predictions_confirm: "Sí, actualizar",

    backup_never: "Última copia: nunca",
    backup_today: "Última copia: hoy",
    backup_yesterday: "Última copia: ayer",
    backup_days_ago_one: "Última copia: hace {n} día",
    backup_days_ago_many: "Última copia: hace {n} días",
    backup_overdue_one: "Última copia: hace {n} día — ¡vencida!",
    backup_overdue_many: "Última copia: hace {n} días — ¡vencida!",

    export_backup_title: "Exportar copia de seguridad",
    export_backup_msg:
      "Tu copia de seguridad se exportará como un archivo cifrado. Solo puede descifrarse con tu PIN. Mantenla privada.",
    export: "Exportar",
    export_failed_title: "Error al exportar",
    export_failed_msg:
      "No se pudo exportar la copia de seguridad. Por favor, inténtalo de nuevo.",
    enter_backup_pin_title: "Ingresar PIN de copia de seguridad",
    enter_backup_pin_msg:
      "Ingresa el PIN que estaba activo cuando se creó esta copia de seguridad.",
    incorrect_pin_simple: "PIN incorrecto. Inténtalo de nuevo.",
    restored_title: "Restaurado",
    restored_msg: "Tu copia de seguridad se ha restaurado correctamente.",
    invalid_backup_title: "Copia de seguridad inválida",
    invalid_backup_msg: "Este formato de copia de seguridad no es compatible.",
    import_failed_title: "Error al importar",
    import_failed_msg:
      "No se pudo leer el archivo de copia de seguridad. Asegúrate de que sea válido.",

    storage_used: "{sizeKB} KB (IndexedDB)",
    storage_unknown: "Desconocido",

    erase_title: "Borrar todos los datos",
    erase_msg:
      "Esto eliminará permanentemente todos tus datos del ciclo y no se puede deshacer. ¿Estás absolutamente segura?",
    erase_confirm: "Sí, borrar todo",
    erase_failed_title: "Error al borrar",
    erase_failed_msg:
      "No se pudieron borrar los datos. Por favor, inténtalo de nuevo.",

    confirm_new_pin: "Confirmar nuevo PIN",
    enter_new_pin: "Ingresar nuevo PIN",
    reenter_pin_msg: "Vuelve a ingresar tu nuevo PIN para confirmar.",
    choose_pin_msg: "Elige un PIN de 4 dígitos.",
    pins_no_match: "Los PIN no coinciden. Inténtalo de nuevo.",
    pin_changed_title: "PIN cambiado",
    pin_changed_msg:
      "Tu PIN ha sido actualizado y todos los datos han sido cifrados nuevamente.\n\nNota: las copias de seguridad anteriores a este cambio aún requerirán tu PIN anterior para restaurarse.",
    pin_change_failed_title: "Error al cambiar el PIN",
    pin_change_failed_msg:
      "No se pudo actualizar el PIN. Por favor, inténtalo de nuevo.",

    calendar_day_period: "día de período",
    calendar_day_ovulation: "día de ovulación",
    calendar_day_fertile: "día fértil",
    calendar_day_regular: "día regular",

    follicular: "Folicular",

    language_label: "Idioma",
    lang_en: "English",
    lang_ru: "Русский",
    lang_es: "Español",
    lang_ja: "日本語",
    lang_zh_tw: "繁體中文",

    // Nav tabs
    nav_calendar: "Calendario",
    nav_insights: "Estadísticas",
    nav_settings: "Ajustes",
    nav_about: "Acerca de",

    settings_cycle_tab: "Configuración del ciclo",
    settings_layout_tab: "Apariencia",
    settings_security_tab: "Seguridad",
    settings_calendar_display: "Calendario",
    settings_cycle_section: "Configuración del ciclo",
    settings_last_period: "Fecha de inicio del último período",
    settings_cycle_length: "Longitud promedio del ciclo (días)",
    settings_period_duration: "Duración del período (días)",
    settings_update_btn: "Actualizar predicciones",
    settings_security_section: "Seguridad y privacidad",
    settings_change_pin: "Cambiar PIN",
    settings_export: "Exportar copia de seguridad cifrada",
    settings_import: "Importar copia de seguridad cifrada",
    settings_storage_label: "Almacenamiento usado:",
    settings_storage_calculating: "Calculando...",
    settings_erase: "Borrar todos los datos",

    // Onboarding
    onboard_sub: "Rastrea tu período y ciclo de forma privada",
    onboard_tagline:
      "Registra tu flujo, estado de ánimo y síntomas — todo en tu dispositivo. Gratis, sin anuncios, totalmente accesible y con privacidad primero.",
    beta_label: "Beta",
    beta_warning_text:
      "Esta aplicación está en desarrollo activo. Las funciones pueden cambiar y pueden ocurrir errores.",
    ob_last_period: "Primer día de tu último período",
    ob_cycle_len: "Longitud promedio del ciclo (días)",
    ob_period_dur: "Duración promedio del período (días)",
    pin_setup_title: "🔒 Establece un PIN de 4 dígitos",
    pin_setup_sub_1: "Tu PIN cifra todos los datos localmente.",
    pin_setup_sub_2: "My Cycle Keeper nunca envía datos a ningún lugar.",
    pin_setup_sub_3: "Si olvidas tu PIN, los datos serán borrados.",
    onboard_start_btn: "Comenzar seguimiento ✨",
    privacy_note_aes: "Cifrado AES-256-GCM.",
    privacy_note_rest:
      "Los datos nunca salen de tu dispositivo. Sin cuentas, sin rastreo, gratis para siempre.",
    timeout_before: "⏱️ La sesión expira en",
    timeout_after: "s de inactividad — toca para restablecer",

    // Flow labels
    flow_light: "Ligero",
    flow_medium: "Moderado",
    flow_heavy: "Abundante",

    // Toast messages
    settings_saved_toast: "Ajustes guardados",
    status_no_data_hint:
      "Empieza a registrar tu período para ver estadísticas.",
    status_import_hint: "o importa tus datos",

    // Storage full error
    storage_full_title: "Almacenamiento lleno",
    storage_full_msg:
      "El almacenamiento de tu dispositivo está lleno. Por favor exporta tus datos o elimina algunos registros.",

    // Forgot PIN second confirmation
    forgot_pin_confirm2_title: "Última advertencia",
    forgot_pin_confirm2_msg:
      "TODOS tus datos de seguimiento serán eliminados permanentemente y no podrán recuperarse. Esto no se puede deshacer.",
    forgot_pin_confirm2_btn: "Sí, eliminar todo",

    // Cycle history
    no_cycle_history:
      "Aún no hay historial de ciclos. Registra al menos 2 períodos para ver el historial.",
    history_showing: "Mostrando los últimos {shown} de {total} ciclos",

    // History legend
    legend_short: "Corto (<26d)",
    legend_normal: "Normal (26–32d)",
    legend_long: "Largo (>32d)",

    // Hardcoded HTML sections
    flow_question: "¿Cómo es tu flujo hoy? 🌊",
    security_info:
      "Todos los datos se cifran con tu PIN antes de guardarse. Cycle Keeper usa la <strong>Web Crypto API</strong> — el mismo estándar que los navegadores usan para HTTPS.<br><br>No se envía ningún dato a ningún servidor. Sin cuentas. Sin analíticas.",
    data_persistence:
      '⚠️ <strong>Persistencia de datos:</strong> Tus datos se almacenan en IndexedDB. Limpiar el caché del navegador es seguro, pero limpiar los "datos del sitio" o "cookies y datos del sitio" en la configuración del navegador BORRARÁ todos tus datos del ciclo. ¡Siempre exporta una copia de seguridad primero!',
    about_info_html:
      'Your Cycle Keeper es software libre creado con atención a la privacidad. Basado en el <strong>Método del Ritmo del Calendario</strong> y el <strong>Método de Días Estándar</strong> para la estimación del ciclo. Solo con fines informativos.<br><br><strong>Versión:</strong> 1.0.0-beta<br><strong>Licencia:</strong> GNU General Public License v3.0<br><strong>Desarrollador:</strong> <a href="https://github.com/pythonime-lab" target="_blank" rel="noopener" class="accessibility-link">pythonime-lab</a><br><br>¿Encontraste un error o tienes una sugerencia? Visita nuestro <a href="https://github.com/pythonime-lab/yourcyclekeeper" target="_blank" rel="noopener" class="accessibility-link">repositorio de GitHub</a>.',
    support_info:
      "My Cycle Keeper es <strong>gratis para siempre</strong> sin anuncios, sin rastreo y sin recopilación de datos. Si lo encuentras útil y quieres apoyar el desarrollo continuo, ¡puedes invitarme un café!",
    support_via: "Apoyar vía",
    support_footer:
      "Tu apoyo ayuda a mantener este proyecto sin anuncios para todos. ¡Gracias! 💜",
    privacy_title: "Garantía de privacidad",
    privacy_info_html:
      "My Cycle Keeper recopila <strong>cero datos</strong>. Esta aplicación:<br>&nbsp;• Almacena todos los datos localmente solo en tu dispositivo<br>&nbsp;• No tiene servidores, cuentas ni almacenamiento en la nube<br>&nbsp;• No tiene analíticas, rastreo ni telemetría<br>&nbsp;• No tiene anuncios ni código de terceros<br>&nbsp;• Nunca transmite ningún dato<br>&nbsp;• Está cifrada con tu PIN mediante AES-256-GCM<br><br>Tus datos de salud son solo tuyos.",
    disclaimer_title: "Aviso médico",
    disclaimer_info_html:
      "⚠️ <strong>Esta aplicación proporciona estimaciones del ciclo basadas en patrones biológicos promedio.</strong> <em>No</em> es consejo médico y no debe usarse como sustituto de la consulta médica profesional.<br><br>My Cycle Keeper predice tu ciclo rastreando patrones y estimando el momento de ovulación. El momento real del ciclo puede variar debido al estrés, enfermedades, medicamentos y muchos otros factores.<br><br><strong>No</strong> uses esta aplicación como anticonceptivo ni como garantía de fertilidad. Consulta siempre a un profesional de la salud cualificado para decisiones médicas.",
    accessibility_title: "Accesibilidad",
    accessibility_info_html:
      'My Cycle Keeper sigue los <strong>estándares de accesibilidad WCAG 2.0</strong>:<br><br>&nbsp;• <strong>Tab/Shift+Tab:</strong> Navegar hacia adelante/atrás por todos los elementos interactivos<br>&nbsp;• <strong>Teclas de flecha:</strong> Navegar por las fechas del calendario<br>&nbsp;• <strong>Enter/Espacio:</strong> Activar botones y enlaces<br>&nbsp;• <strong>Escape:</strong> Cerrar modales y devolver el foco al elemento activador<br>&nbsp;• <strong>Entrada de PIN:</strong> Escribe dígitos 0-9 y Retroceso en todas las pantallas de PIN<br>&nbsp;• <strong>Controles de formulario:</strong> Soporte de teclado nativo para inputs, selects y textareas<br>&nbsp;• <strong>Lectores de pantalla:</strong> HTML semántico con etiquetas ARIA y roles apropiados<br>&nbsp;• <strong>Gestión del foco:</strong> Indicadores de foco visibles, orden de tabulación lógico<br><br>Estándares basados en las <a href="https://trailhead.salesforce.com/content/learn/modules/coding-for-web-accessibility/understand-accessible-navigation" target="_blank" rel="noopener" class="accessibility-link">Directrices de Accesibilidad de Salesforce</a>.',
  },

  // ── Japanese ───────────────────────────────────────────────────────────────
  ja: {
    about_tab_developer: "開発者",
    about_tab_privacy: "プライバシー",
    about_tab_disclaimer: "免責事項",
    privacy_title: "プライバシー保証",
    privacy_info:
      "My Cycle Keeperはデータを一切収集しません。このアプリは：デバイス上にのみデータをローカル保存します；サーバー・アカウント・クラウドストレージはありません；分析・追跡・テレメトリーはありません；広告・サードパーティコードはありません；データを外部に送信しません；AES-256-GCMによりPINで暗号化されています。あなたの健康データはあなただけのものです。",
    about_title: "Your Cycle Keeperについて",
    about_info:
      "Your Cycle Keeperはプライバシーへの配慮から作られた無料ソフトウェアです。カレンダーリズム法と標準日法に基づいたサイクル推定。情報提供のみを目的としています。バージョン：1.0.0-beta。ライセンス：GPL v3。開発者：pythonime-lab。バグや提案はGitHubリポジトリへ。",
    support_title: "開発を支援する",
    support_info:
      "My Cycle Keeperは広告・追跡・データ収集なしで永久無料です。役に立てていただけましたら、コーヒーを一杯おごっていただけると嬉しいです！",
    disclaimer_title: "医療免責事項",
    disclaimer_info:
      "⚠️ このアプリは平均的な生物学的パターンに基づくサイクル推定を提供します。医療アドバイスではなく、専門医の診察の代替として使用してはいけません。My Cycle Keeperはパターンを追跡してサイクルを予測し、排卵タイミングを推定します。実際のサイクルは、ストレス・病気・薬などさまざまな要因で変動します。避妊や妊娠の保証としてこのアプリを使用しないでください。医療的な決定には必ず専門の医療従事者にご相談ください。",
    accessibility_title: "アクセシビリティ",
    accessibility_info:
      "My Cycle KeeperはWCAG 2.0アクセシビリティ基準に準拠しています。Tab/Shift+Tab：すべてのインタラクティブ要素を前後に移動；矢印キー：カレンダー日付を移動；Enter/Space：ボタンとリンクを実行；Escape：モーダルを閉じてフォーカスを戻す；PIN入力：数字0〜9とBackspace；フォームコントロール：入力・選択・テキストエリアのネイティブキーボードサポート；スクリーンリーダー：適切なARIAラベルとロールを含むセマンティックHTML；フォーカス管理：可視フォーカスインジケーター、論理的なタブ順序。",

    cycle_stats: "サイクル統計",
    avg_length: "平均周期",
    cycles_logged: "記録済みサイクル",
    avg_period: "平均生理期間",
    fertile_days: "妊娠可能日",
    symptom_tracking: "症状記録",
    period: "生理",
    ovulation: "排卵",
    flow: "経血量",
    pain: "痛み",
    mood: "気分",
    how_it_works: "仕組み",
    how_it_works_p1:
      "My Cycle Keeperはサイクルパターンを追跡して妊娠可能期間を推定します。排卵は次の生理の約14日前と推定されます。妊娠可能日は8日目から（周期長さ－11）まで計算されます。",
    how_it_works_p2:
      "28日周期の場合、通常8〜17日目が妊娠可能日で、14日目頃に排卵します。",
    disclaimer: "免責事項",
    estimation_disclaimer:
      "⚠️ 推定ツールのみです。避妊には使用しないでください。ストレス・病気・薬は時期に影響します。",
    no_symptoms_logged: "まだ症状が記録されていません — 今日から記録を始めましょう",
    cycle_history: "サイクル履歴",
    all_months: "すべての月",
    cycle_day: "サイクル日",
    until_next: "次まで",
    day_1: "1日目",
    avg_length_short: "平均周期",
    period_short: "生理",
    fertile: "妊娠可能",
    ovulation_short: "排卵",
    luteal: "黄体期",

    storage_error_title: "ストレージエラー",
    storage_error_msg: "ストレージにアクセスできませんでした。ページを再読み込みしてください。",
    db_error_title: "データベースエラー",
    db_error_msg: "アプリのストレージを初期化できませんでした。ページを再読み込みしてください。",

    unlock_subtitle: "PINを入力してプライベートな健康データのロックを解除してください",
    too_many_attempts: "試行回数が多すぎます。{secs}秒後に再試行してください。",
    locked_out: "🚫 試行回数が多すぎます。60秒間ロックされました。",
    lockout_ended: "ロック解除されました。再試行してください。",
    incorrect_pin_many: "PINが違います。残り{remaining}回。",
    decryption_failed: "復号化に失敗しました。データが破損している可能性があります。",
    error_try_again: "エラーが発生しました。もう一度お試しください。",

    forgot_pin_title: "PINを忘れましたか？",
    forgot_pin_msg:
      "すべてのサイクルデータが完全に削除され、My Cycle Keeperがリセットされます。この操作は取り消せません。よろしいですか？",
    forgot_pin_confirm: "はい、削除してリセット",
    reset_complete_title: "リセット完了",
    reset_complete_msg: "My Cycle Keeperがリセットされました。新しいPINを設定してください。",
    reset_failed_title: "リセット失敗",
    reset_failed_msg: "データを削除できませんでした。ページを再読み込みして再試行してください。",

    save_failed_title: "保存失敗",
    save_failed_msg: "データを保存できませんでした。もう一度お試しください。",
    missing_date_title: "日付がありません",
    missing_date_msg: "最後の生理の初日を入力してください。",
    set_pin_title: "PINを設定",
    set_pin_msg: "4桁のPINを入力してデータを保護してください。",
    setup_error_title: "設定エラー",
    setup_error_msg: "設定を完了できませんでした。ページを再読み込みして再試行してください。",

    note_count: "{count} / 500",
    note_placeholder: "メモを追加…",

    set_flow: "経血量を設定",
    save: "保存",
    cancel: "キャンセル",
    ok: "OK",
    refresh: "更新",
    pain_label: "痛み {value} / 10",
    set_pain: "痛みを設定",
    mood_low: "気分が悪い",
    mood_happy: "幸せ",
    mood_neutral: "普通",
    set_mood: "気分を設定",

    period_expected_in_many: "{n}日後に生理が予定されています",

    phase_menstruation: "生理中 🩸",
    phase_follicular: "卵胞期 ✨",
    phase_fertile: "妊娠可能日 🌿",
    phase_ovulation: "排卵日 🌟",
    phase_luteal: "黄体期 🌙",

    subtitle_menstruation: "生理{day}日目",
    subtitle_fertile: "{start}〜{end}日目が妊娠可能",
    subtitle_ovulation: "本日が最高妊娠可能日",
    subtitle_other: "次の生理まで{n}日",

    status_cycle_day_of: "{total}日周期の{day}日目",
    status_period_today: "今日生理が来る予定です",
    status_period_soon_date: "今日または{date}頃に生理が来る可能性があります",
    status_period_in_date: "次の生理は{date}頃の予定です",
    now: "現在",
    bar_day: "{n}日目",

    cycle_history_empty: "サイクル履歴を見るには、2回以上の生理開始日を記録してください。",
    history_days_many: "{n}日",
    no_data_yet: "まだデータが記録されていません",

    chart_full_year: "{year}年全体",
    chart_month_year: "{year}年{month}月",

    download_failed_title: "ダウンロード失敗",
    download_failed_msg: "チャートをダウンロードできませんでした。もう一度お試しください。",

    invalid_date_title: "無効な日付",
    invalid_date_msg: "有効な生理開始日を入力してください。",
    invalid_cycle_title: "無効な周期長",
    invalid_cycle_msg: "周期長は20〜45日の間でなければなりません。",
    invalid_duration_title: "無効な期間",
    invalid_duration_msg: "生理期間は1〜10日の間でなければなりません。",
    update_predictions_title: "予測を更新しますか？",
    update_predictions_msg:
      "新しい設定に基づいてすべての周期予測が再計算されます。記録された症状とメモは変更されません。続けますか？",
    update_predictions_confirm: "はい、更新する",

    backup_never: "最後のバックアップ：なし",
    backup_today: "最後のバックアップ：今日",
    backup_yesterday: "最後のバックアップ：昨日",
    backup_days_ago_many: "最後のバックアップ：{n}日前",
    backup_overdue_many: "最後のバックアップ：{n}日前 — 更新が必要！",

    export_backup_title: "バックアップをエクスポート",
    export_backup_msg:
      "バックアップは暗号化ファイルとしてエクスポートされます。PINがないと復号化できません。安全に保管してください。",
    export: "エクスポート",
    export_failed_title: "エクスポート失敗",
    export_failed_msg: "バックアップをエクスポートできませんでした。もう一度お試しください。",
    enter_backup_pin_title: "バックアップPINを入力",
    enter_backup_pin_msg: "このバックアップを作成したときのPINを入力してください。",
    incorrect_pin_simple: "PINが違います。もう一度お試しください。",
    restored_title: "復元完了",
    restored_msg: "バックアップが正常に復元されました。",
    invalid_backup_title: "無効なバックアップ",
    invalid_backup_msg: "このバックアップ形式はサポートされていません。",
    import_failed_title: "インポート失敗",
    import_failed_msg: "バックアップファイルを読み込めませんでした。有効なファイルを確認してください。",

    storage_used: "{sizeKB} KB (IndexedDB)",
    storage_unknown: "不明",

    erase_title: "すべてのデータを削除",
    erase_msg:
      "すべてのサイクルデータが完全に削除され、取り消すことはできません。本当によろしいですか？",
    erase_confirm: "はい、すべて削除",
    erase_failed_title: "削除失敗",
    erase_failed_msg: "データを削除できませんでした。もう一度お試しください。",

    confirm_new_pin: "新しいPINを確認",
    enter_new_pin: "新しいPINを入力",
    reenter_pin_msg: "確認のため新しいPINをもう一度入力してください。",
    choose_pin_msg: "4桁のPINを選択してください。",
    pins_no_match: "PINが一致しません。もう一度お試しください。",
    pin_changed_title: "PIN変更完了",
    pin_changed_msg:
      "PINが更新され、すべてのデータが再暗号化されました。\n\nご注意：この変更前に作成されたバックアップの復元には古いPINが必要です。",
    pin_change_failed_title: "PIN変更失敗",
    pin_change_failed_msg: "PINを更新できませんでした。もう一度お試しください。",

    calendar_day_period: "生理日",
    calendar_day_ovulation: "排卵日",
    calendar_day_fertile: "妊娠可能日",
    calendar_day_regular: "通常日",
    calendar_day_period_possible: "生理予定日",

    stat_std_dev: "標準偏差",
    stat_range: "周期の範囲",
    stat_prediction_window: "予測ウィンドウ",
    stat_regularity: "規則性",
    stat_regular: "規則的",
    stat_variable: "不規則",

    follicular: "卵胞期",

    settings_autofill_label: "生理日の自動入力",
    settings_autofill_hint: "生理初日の記録後、軽度の経血量で自動入力する日数。0で無効化。",
    autofill_banner_msg_many: "{n}日分を軽度の経血量で自動入力しました。",
    autofill_banner_settings: "設定で変更",
    autofill_banner_backup_pre: "",
    autofill_banner_backup: "バックアップをお忘れなく",

    language_label: "言語",
    lang_en: "English",
    lang_ru: "Русский",
    lang_es: "Español",
    lang_ja: "日本語",
    lang_zh_tw: "繁體中文",

    settings_theme_label: "テーマ",
    theme_default: "YCK クラシック",
    theme_light: "ニュースルーム ライト",
    theme_dark: "ニュースルーム ダーク",
    theme_kawaii: "ピンクパワー 🌸",

    nav_calendar: "カレンダー",
    nav_insights: "インサイト",
    nav_settings: "設定",
    nav_about: "About",

    settings_cycle_tab: "サイクル設定",
    settings_layout_tab: "レイアウト",
    settings_security_tab: "セキュリティとプライバシー",
    settings_calendar_display: "カレンダー",
    settings_cycle_section: "サイクル設定",
    settings_last_period: "最後の生理開始日",
    settings_cycle_length: "平均周期長（日）",
    settings_period_duration: "生理期間（日）",
    settings_update_btn: "予測を更新",
    settings_tolerance: "予測許容日数",
    settings_tolerance_hint:
      "カレンダーに表示される予測生理日の前後の日数。空白にすると自動（周期の規則性に基づく）。",
    save: "保存",
    settings_show_fertility: "カレンダーに妊娠可能期間を表示",
    settings_security_section: "セキュリティとプライバシー",
    settings_change_pin: "PINを変更",
    settings_export: "暗号化バックアップをエクスポート",
    settings_import: "暗号化バックアップをインポート",
    settings_import_drip: "dripからインポート（CSV）",

    drip_import_title: "dripからインポート",
    drip_import_found:
      "{days}日分のデータ（{periods}日分の経血を含む）が見つかりました。インポート方法を選択してください。",
    drip_import_merge: "マージ（自分のデータを保持）",
    drip_import_replace: "上書き（dripのデータを使用）",
    drip_import_done_title: "インポート完了",
    drip_import_done_msg: "{days}日分のデータが正常にインポートされました。",
    drip_import_failed_title: "インポート失敗",
    drip_import_failed_msg: "ファイルを読み込めませんでした。dripのCSVエクスポートであることを確認してください。",
    drip_import_empty_title: "インポートするデータがありません",
    drip_import_empty_msg: "ファイルに使用可能なデータが含まれていませんでした。",
    settings_storage_label: "使用ストレージ：",
    settings_storage_calculating: "計算中...",
    settings_erase: "すべてのデータを削除",

    onboard_sub: "生理とサイクルをプライベートに記録",
    onboard_tagline:
      "経血量・気分・症状をデバイス上で記録。無料、広告なし、完全にプライベート。",
    beta_label: "ベータ",
    beta_warning_text:
      "このアプリは現在開発中です。機能が変わる可能性があり、バグが発生することがあります。",
    ob_last_period: "最後の生理の初日",
    ob_cycle_len: "平均周期長（日）",
    ob_period_dur: "平均生理期間（日）",
    pin_setup_title: "🔒 4桁のPINを設定",
    pin_setup_sub_1: "PINはすべてのデータをローカルで暗号化します。",
    pin_setup_sub_2: "My Cycle Keeperはデータを外部に送信しません。",
    pin_setup_sub_3: "PINを忘れた場合、データは削除されます。",
    onboard_start_btn: "記録を始める ✨",
    privacy_note_aes: "AES-256-GCM暗号化。",
    privacy_note_rest:
      "データはデバイスから外に出ません。アカウント不要、追跡なし、永久無料。",
    timeout_before: "⏱️ セッションが",
    timeout_after: "秒後に期限切れになります — タップしてリセット",

    flow_light: "少ない",
    flow_medium: "普通",
    flow_heavy: "多い",

    settings_saved_toast: "設定が保存されました",
    status_no_data_hint:
      "生理を記録すると統計が表示されます。",
    status_import_hint: "またはデータをインポート",

    storage_full_title: "ストレージ満杯",
    storage_full_msg:
      "デバイスのストレージが満杯です。データをエクスポートするか、ログを削除してスペースを確保してください。",

    forgot_pin_confirm2_title: "最終警告",
    forgot_pin_confirm2_msg:
      "すべての生理記録データが完全に削除され、復元できません。この操作は取り消せません。",
    forgot_pin_confirm2_btn: "はい、すべて削除する",

    no_cycle_history: "まだサイクル履歴がありません。2回以上の生理を記録してください。",
    history_showing: "全{total}サイクルのうち最新{shown}件を表示",
    predictions_tab: "次回の生理",
    predictions_empty: "予測を表示するには、少なくとも1回の生理開始日を記録してください。",
    history_col_start: "開始",
    history_col_end: "終了",
    history_col_period: "生理",
    history_col_cycle: "周期",
    view_all_history: "すべて表示",

    legend_short: "短い（26日未満）",
    legend_normal: "普通（26〜32日）",
    legend_long: "長い（32日超）",

    flow_question: "今日の経血量は？ 🌊",
    security_info:
      "すべてのデータはPINで暗号化されてから保存されます。Cycle KeeperはHTTPSと同じ標準である<strong>Web Crypto API</strong>を使用しています。<br><br>サーバーへのデータ送信はゼロです。アカウント不要。分析なし。",
    data_persistence:
      '⚠️ <strong>データの永続性：</strong>データはIndexedDBに保存されています。ブラウザのキャッシュをクリアしても安全ですが、ブラウザ設定で「サイトデータ」や「Cookieとサイトデータ」をクリアすると、すべてのサイクルデータが削除されます。必ず先にバックアップをエクスポートしてください！',
    about_info_html:
      'Your Cycle Keeperはプライバシーへの配慮から作られた無料ソフトウェアです。<strong>カレンダーリズム法</strong>と<strong>標準日法</strong>に基づいたサイクル推定。情報提供のみを目的としています。<br><br><strong>バージョン：</strong>1.0.0-beta<br><strong>ライセンス：</strong>GNU General Public License v3.0<br><strong>開発者：</strong><a href="https://github.com/pythonime-lab" target="_blank" rel="noopener" class="accessibility-link">pythonime-lab</a><br><br>バグや提案は<a href="https://github.com/pythonime-lab/yourcyclekeeper" target="_blank" rel="noopener" class="accessibility-link">GitHubリポジトリ</a>へ。',
    support_info:
      "My Cycle Keeperは広告・追跡・データ収集なしで<strong>永久無料</strong>です。役に立てていただけましたら、コーヒーを一杯おごっていただけると嬉しいです！",
    support_via: "支援する",
    support_footer:
      "あなたのサポートがこのプロジェクトを維持し、みんなのために広告なしを実現します。ありがとうございます！💜",
    privacy_info_html:
      "My Cycle Keeperは<strong>データを一切収集しません</strong>。このアプリは：<br>&nbsp;• デバイス上にのみデータをローカル保存<br>&nbsp;• サーバー・アカウント・クラウドストレージなし<br>&nbsp;• 分析・追跡・テレメトリーなし<br>&nbsp;• 広告・サードパーティコードなし<br>&nbsp;• データを外部に送信しない<br>&nbsp;• AES-256-GCMによりPINで暗号化<br><br>あなたの健康データはあなただけのものです。",
    disclaimer_info_html:
      "⚠️ <strong>このアプリは平均的な生物学的パターンに基づくサイクル推定を提供します。</strong>医療アドバイスではなく、<em>専門医の診察の代替として使用してはいけません。</em><br><br>My Cycle Keeperはパターンを追跡してサイクルを予測し、排卵タイミングを推定します。実際のサイクルは、ストレス・病気・薬などさまざまな要因で変動します。<br><br>避妊や妊娠の<strong>保証</strong>としてこのアプリを使用しないでください。医療的な決定には必ず専門の医療従事者にご相談ください。",
    accessibility_info_html:
      'My Cycle KeeperはWCAG 2.0アクセシビリティ基準に準拠しています：<br><br>&nbsp;• <strong>Tab/Shift+Tab：</strong>すべてのインタラクティブ要素を前後に移動<br>&nbsp;• <strong>矢印キー：</strong>カレンダー日付を移動<br>&nbsp;• <strong>Enter/Space：</strong>ボタンとリンクを実行<br>&nbsp;• <strong>Escape：</strong>モーダルを閉じてフォーカスを戻す<br>&nbsp;• <strong>PIN入力：</strong>数字0〜9とBackspace<br>&nbsp;• <strong>フォームコントロール：</strong>入力・選択・テキストエリアのネイティブキーボードサポート<br>&nbsp;• <strong>スクリーンリーダー：</strong>適切なARIAラベルとロールを含むセマンティックHTML<br>&nbsp;• <strong>フォーカス管理：</strong>可視フォーカスインジケーター、論理的なタブ順序',
  },

  // ── Traditional Chinese ────────────────────────────────────────────────────
  "zh-TW": {
    about_tab_developer: "開發者",
    about_tab_privacy: "隱私",
    about_tab_disclaimer: "免責聲明",
    privacy_title: "隱私保障",
    privacy_info:
      "My Cycle Keeper不收集任何資料。本應用程式：僅在您的裝置上本地儲存資料；無伺服器、帳戶或雲端儲存；無分析、追蹤或遙測；無廣告、無第三方程式碼；不向任何地方傳輸資料；使用AES-256-GCM透過PIN加密。您的健康資料僅屬於您。",
    about_title: "關於Your Cycle Keeper",
    about_info:
      "Your Cycle Keeper是一款注重隱私的免費軟體。基於日曆節奏法和標準日法進行週期估算。僅供參考。版本：1.0.0-beta。授權：GPL v3。開發者：pythonime-lab。有錯誤或建議？請造訪GitHub儲存庫。",
    support_title: "支持開發",
    support_info:
      "My Cycle Keeper永久免費，無廣告、無追蹤、無資料收集。若您覺得有幫助，歡迎請我喝一杯咖啡！",
    disclaimer_title: "醫療免責聲明",
    disclaimer_info:
      "⚠️ 本應用程式提供基於平均生物學模式的週期估算。這不是醫療建議，不能替代專業醫療諮詢。My Cycle Keeper透過追蹤模式預測您的週期並估算排卵時間。實際週期時間可能因壓力、疾病、藥物等多種因素而有所不同。請勿將本應用程式用作避孕或生育保證。醫療決定請務必諮詢合格的醫療專業人員。",
    accessibility_title: "無障礙功能",
    accessibility_info:
      "My Cycle Keeper遵循WCAG 2.0無障礙標準。Tab/Shift+Tab：在所有互動元素間前後導覽；方向鍵：導覽日曆日期；Enter/Space：啟動按鈕和連結；Escape：關閉對話框並返回焦點；PIN輸入：0-9數字和Backspace；表單控制項：原生鍵盤支援；螢幕閱讀器：語義HTML含ARIA標籤；焦點管理：可見焦點指示器、邏輯Tab順序。",

    cycle_stats: "週期統計",
    avg_length: "平均週期",
    cycles_logged: "已記錄週期",
    avg_period: "平均生理期",
    fertile_days: "可孕期",
    symptom_tracking: "症狀追蹤",
    period: "生理期",
    ovulation: "排卵",
    flow: "經血量",
    pain: "疼痛",
    mood: "心情",
    how_it_works: "運作原理",
    how_it_works_p1:
      "My Cycle Keeper透過追蹤週期模式來估算您的可孕期。排卵估計在下次生理期前約14天。可孕期計算為第8天至（週期長度－11）天。",
    how_it_works_p2:
      "對於規律的28天週期，第8至17天通常為可孕期，排卵約在第14天。",
    disclaimer: "免責聲明",
    estimation_disclaimer:
      "⚠️ 僅為估算工具。請勿用於避孕。壓力、疾病和藥物可能影響時間。",
    no_symptoms_logged: "尚未記錄任何症狀 — 從今天開始記錄吧",
    cycle_history: "週期歷史",
    all_months: "所有月份",
    cycle_day: "週期日",
    until_next: "距下次",
    day_1: "第1天",
    avg_length_short: "平均週期",
    period_short: "生理期",
    fertile: "可孕期",
    ovulation_short: "排卵",
    luteal: "黃體期",

    storage_error_title: "儲存錯誤",
    storage_error_msg: "無法存取儲存空間。請重新整理頁面。",
    db_error_title: "資料庫錯誤",
    db_error_msg: "無法初始化應用程式儲存空間。請嘗試重新整理頁面。",

    unlock_subtitle: "輸入PIN以解鎖您的私人健康資料",
    too_many_attempts: "嘗試次數太多。請在{secs}秒後再試。",
    locked_out: "🚫 嘗試次數太多。已鎖定60秒。",
    lockout_ended: "鎖定已解除。請再試一次。",
    incorrect_pin_many: "PIN不正確。剩餘{remaining}次嘗試。",
    decryption_failed: "解密失敗。資料可能已損壞。",
    error_try_again: "發生錯誤。請再試一次。",

    forgot_pin_title: "忘記PIN？",
    forgot_pin_msg:
      "這將永久刪除所有週期資料並重置My Cycle Keeper。此操作無法撤銷。您確定嗎？",
    forgot_pin_confirm: "是的，刪除並重置",
    reset_complete_title: "重置完成",
    reset_complete_msg: "My Cycle Keeper已重置。請設定新PIN以開始使用。",
    reset_failed_title: "重置失敗",
    reset_failed_msg: "無法清除您的資料。請重新整理頁面並再試一次。",

    save_failed_title: "儲存失敗",
    save_failed_msg: "無法儲存您的資料。請再試一次。",
    missing_date_title: "缺少日期",
    missing_date_msg: "請輸入上次生理期的第一天。",
    set_pin_title: "設定PIN",
    set_pin_msg: "輸入4位數PIN以保護您的資料。",
    setup_error_title: "設定錯誤",
    setup_error_msg: "無法完成設定。請重新整理頁面並再試一次。",

    note_count: "{count} / 500",
    note_placeholder: "新增備註…",

    set_flow: "設定經血量",
    save: "儲存",
    cancel: "取消",
    ok: "確定",
    refresh: "重新整理",
    pain_label: "疼痛 {value} / 10",
    set_pain: "設定疼痛",
    mood_low: "心情低落",
    mood_happy: "開心",
    mood_neutral: "普通",
    set_mood: "設定心情",

    period_expected_in_many: "預計{n}天後來生理期",

    phase_menstruation: "生理期 🩸",
    phase_follicular: "卵泡期 ✨",
    phase_fertile: "可孕期 🌿",
    phase_ovulation: "排卵日 🌟",
    phase_luteal: "黃體期 🌙",

    subtitle_menstruation: "生理期第{day}天",
    subtitle_fertile: "第{start}至{end}天為可孕期",
    subtitle_ovulation: "今日受孕機率最高",
    subtitle_other: "距下次生理期{n}天",

    status_cycle_day_of: "{total}天週期的第{day}天",
    status_period_today: "預計今天來生理期",
    status_period_soon_date: "生理期可能今天或{date}左右開始",
    status_period_in_date: "預計{date}左右來生理期",
    now: "現在",
    bar_day: "第{n}天",

    cycle_history_empty: "記錄至少2個生理期開始日期以查看週期歷史。",
    history_days_many: "{n}天",
    no_data_yet: "尚未記錄任何追蹤資料",

    chart_full_year: "{year}年全年",
    chart_month_year: "{year}年{month}月",

    download_failed_title: "下載失敗",
    download_failed_msg: "無法下載圖表。請再試一次。",

    invalid_date_title: "無效日期",
    invalid_date_msg: "請輸入有效的上次生理期日期。",
    invalid_cycle_title: "無效週期長度",
    invalid_cycle_msg: "週期長度必須在20至45天之間。",
    invalid_duration_title: "無效期間",
    invalid_duration_msg: "生理期間必須在1至10天之間。",
    update_predictions_title: "更新預測？",
    update_predictions_msg:
      "這將根據您的新設定重新計算所有週期預測。已記錄的症狀和備註將保持不變。繼續嗎？",
    update_predictions_confirm: "是的，更新",

    backup_never: "上次備份：從未",
    backup_today: "上次備份：今天",
    backup_yesterday: "上次備份：昨天",
    backup_days_ago_many: "上次備份：{n}天前",
    backup_overdue_many: "上次備份：{n}天前 — 已過期！",

    export_backup_title: "匯出備份",
    export_backup_msg:
      "您的備份將匯出為加密檔案。只有使用您的PIN才能解密。請妥善保管。",
    export: "匯出",
    export_failed_title: "匯出失敗",
    export_failed_msg: "無法匯出備份。請再試一次。",
    enter_backup_pin_title: "輸入備份PIN",
    enter_backup_pin_msg: "請輸入建立此備份時使用的PIN。",
    incorrect_pin_simple: "PIN不正確。請再試一次。",
    restored_title: "已還原",
    restored_msg: "您的備份已成功還原。",
    invalid_backup_title: "無效備份",
    invalid_backup_msg: "此備份格式不受支援。",
    import_failed_title: "匯入失敗",
    import_failed_msg: "無法讀取備份檔案。請確保檔案有效。",

    storage_used: "{sizeKB} KB (IndexedDB)",
    storage_unknown: "未知",

    erase_title: "刪除所有資料",
    erase_msg:
      "這將永久刪除所有您的週期資料，且無法撤銷。您絕對確定嗎？",
    erase_confirm: "是的，刪除所有內容",
    erase_failed_title: "刪除失敗",
    erase_failed_msg: "無法刪除資料。請再試一次。",

    confirm_new_pin: "確認新PIN",
    enter_new_pin: "輸入新PIN",
    reenter_pin_msg: "請再次輸入新PIN以確認。",
    choose_pin_msg: "選擇4位數PIN。",
    pins_no_match: "PIN不符。請再試一次。",
    pin_changed_title: "PIN已更改",
    pin_changed_msg:
      "您的PIN已更新，所有資料已重新加密。\n\n注意：在此更改之前建立的備份仍需要您的舊PIN才能還原。",
    pin_change_failed_title: "PIN更改失敗",
    pin_change_failed_msg: "無法更新PIN。請再試一次。",

    calendar_day_period: "生理期日",
    calendar_day_ovulation: "排卵日",
    calendar_day_fertile: "可孕期日",
    calendar_day_regular: "一般日",
    calendar_day_period_possible: "可能的生理期日",

    stat_std_dev: "標準差",
    stat_range: "週期範圍",
    stat_prediction_window: "預測視窗",
    stat_regularity: "規律性",
    stat_regular: "規律",
    stat_variable: "不規律",

    follicular: "卵泡期",

    settings_autofill_label: "自動填入生理期天數",
    settings_autofill_hint: "記錄生理期第一天後，自動填入少量經血的天數。設為0可停用此功能。",
    autofill_banner_msg_many: "已自動填入{n}天的少量經血記錄。",
    autofill_banner_settings: "在設定中調整",
    autofill_banner_backup_pre: "",
    autofill_banner_backup: "記得備份",

    language_label: "語言",
    lang_en: "English",
    lang_ru: "Русский",
    lang_es: "Español",
    lang_ja: "日本語",
    lang_zh_tw: "繁體中文",

    settings_theme_label: "主題",
    theme_default: "YCK 經典",
    theme_light: "新聞室 淺色",
    theme_dark: "新聞室 深色",
    theme_kawaii: "粉紅力量 🌸",

    nav_calendar: "日曆",
    nav_insights: "洞察",
    nav_settings: "設定",
    nav_about: "關於",

    settings_cycle_tab: "週期設定",
    settings_layout_tab: "介面設定",
    settings_security_tab: "安全與隱私",
    settings_calendar_display: "日曆",
    settings_cycle_section: "週期設定",
    settings_last_period: "上次生理期開始日期",
    settings_cycle_length: "平均週期長度（天）",
    settings_period_duration: "生理期間（天）",
    settings_update_btn: "更新預測",
    settings_tolerance: "預測容差（天）",
    settings_tolerance_hint:
      "日曆中每個預測生理期前後顯示的天數。留空則自動（根據您的週期規律性）。",
    save: "儲存",
    settings_show_fertility: "在日曆中顯示可孕期",
    settings_security_section: "安全與隱私",
    settings_change_pin: "更改PIN",
    settings_export: "匯出加密備份",
    settings_import: "匯入加密備份",
    settings_import_drip: "從drip匯入（CSV）",

    drip_import_title: "從drip匯入",
    drip_import_found:
      "找到{days}天的資料，包含{periods}天的經血記錄。您想如何匯入？",
    drip_import_merge: "合併（保留我的資料）",
    drip_import_replace: "取代（使用drip資料）",
    drip_import_done_title: "匯入完成",
    drip_import_done_msg: "已成功匯入{days}天的資料。",
    drip_import_failed_title: "匯入失敗",
    drip_import_failed_msg: "無法讀取檔案。請確保這是drip CSV匯出檔案。",
    drip_import_empty_title: "無可匯入的內容",
    drip_import_empty_msg: "該檔案不包含可用資料。",
    settings_storage_label: "已使用儲存空間：",
    settings_storage_calculating: "計算中...",
    settings_erase: "刪除所有資料",

    onboard_sub: "私密追蹤您的生理期和週期",
    onboard_tagline:
      "在您的裝置上追蹤經血量、心情和症狀。免費、無廣告、完全隱私。",
    beta_label: "測試版",
    beta_warning_text:
      "本應用程式目前正在積極開發中。功能可能會變更，可能會出現錯誤。",
    ob_last_period: "上次生理期的第一天",
    ob_cycle_len: "平均週期長度（天）",
    ob_period_dur: "平均生理期間（天）",
    pin_setup_title: "🔒 設定4位數PIN",
    pin_setup_sub_1: "您的PIN在本地加密所有資料。",
    pin_setup_sub_2: "My Cycle Keeper從不向任何地方傳送資料。",
    pin_setup_sub_3: "如果您忘記PIN，資料將被清除。",
    onboard_start_btn: "開始追蹤 ✨",
    privacy_note_aes: "AES-256-GCM加密。",
    privacy_note_rest:
      "資料永遠不會離開您的裝置。無帳戶、無追蹤、永久免費。",
    timeout_before: "⏱️ 工作階段將在",
    timeout_after: "秒無操作後過期 — 點擊重置",

    flow_light: "少量",
    flow_medium: "中量",
    flow_heavy: "大量",

    settings_saved_toast: "設定已儲存",
    status_no_data_hint:
      "開始記錄生理期以顯示統計資料。",
    status_import_hint: "或匯入您的資料",

    storage_full_title: "儲存空間已滿",
    storage_full_msg:
      "您的裝置儲存空間已滿。請匯出您的資料或清除一些記錄以釋放空間。",

    forgot_pin_confirm2_title: "最後警告",
    forgot_pin_confirm2_msg:
      "所有您的生理期追蹤資料將被永久刪除，無法恢復。此操作無法撤銷。",
    forgot_pin_confirm2_btn: "是的，刪除所有內容",

    no_cycle_history: "尚無週期歷史。請記錄至少2個生理期以查看歷史。",
    history_showing: "顯示{total}個週期中的最後{shown}個",
    predictions_tab: "即將到來的生理期",
    predictions_empty: "請記錄至少一個生理期開始日期以查看預測。",
    history_col_start: "開始",
    history_col_end: "結束",
    history_col_period: "生理期",
    history_col_cycle: "週期",
    view_all_history: "查看全部",

    legend_short: "短（< 26天）",
    legend_normal: "正常（26–32天）",
    legend_long: "長（> 32天）",

    flow_question: "今天的經血量如何？ 🌊",
    security_info:
      "所有資料在儲存前都以您的PIN加密。Cycle Keeper使用與HTTPS相同標準的<strong>Web Crypto API</strong>。<br><br>零資料傳送至任何伺服器。無帳戶。無分析。",
    data_persistence:
      '⚠️ <strong>資料持久性：</strong>您的資料儲存在IndexedDB中。清除瀏覽器快取是安全的，但在瀏覽器設定中清除「網站資料」或「Cookie和網站資料」將會清除所有週期資料。請務必先匯出備份！',
    about_info_html:
      'Your Cycle Keeper是一款注重隱私的免費軟體。基於<strong>日曆節奏法</strong>和<strong>標準日法</strong>進行週期估算。僅供參考。<br><br><strong>版本：</strong>1.0.0-beta<br><strong>授權：</strong>GNU General Public License v3.0<br><strong>開發者：</strong><a href="https://github.com/pythonime-lab" target="_blank" rel="noopener" class="accessibility-link">pythonime-lab</a><br><br>有錯誤或建議？請造訪我們的<a href="https://github.com/pythonime-lab/yourcyclekeeper" target="_blank" rel="noopener" class="accessibility-link">GitHub儲存庫</a>。',
    support_info:
      "My Cycle Keeper<strong>永久免費</strong>，無廣告、無追蹤、無資料收集。若您覺得有幫助，歡迎請我喝一杯咖啡！",
    support_via: "透過以下方式支持",
    support_footer:
      "您的支持幫助維持此專案並讓所有人免受廣告困擾。謝謝！💜",
    privacy_info_html:
      "My Cycle Keeper收集<strong>零資料</strong>。本應用程式：<br>&nbsp;• 僅在您的裝置上本地儲存所有資料<br>&nbsp;• 無伺服器、帳戶或雲端儲存<br>&nbsp;• 無分析、追蹤或遙測<br>&nbsp;• 無廣告、無第三方程式碼<br>&nbsp;• 不向任何地方傳輸資料<br>&nbsp;• 使用AES-256-GCM透過PIN加密<br><br>您的健康資料僅屬於您。",
    disclaimer_info_html:
      "⚠️ <strong>本應用程式提供基於平均生物學模式的週期估算。</strong>這<em>不是</em>醫療建議，不能替代專業醫療諮詢。<br><br>My Cycle Keeper透過追蹤模式預測您的週期並估算排卵時間。實際週期時間可能因壓力、疾病、藥物等多種因素而有所不同。<br><br>請<strong>勿</strong>將本應用程式用作避孕或生育保證。醫療決定請務必諮詢合格的醫療專業人員。",
    accessibility_info_html:
      'My Cycle Keeper遵循<strong>WCAG 2.0無障礙標準</strong>：<br><br>&nbsp;• <strong>Tab/Shift+Tab：</strong>在所有互動元素間前後導覽<br>&nbsp;• <strong>方向鍵：</strong>導覽日曆日期<br>&nbsp;• <strong>Enter/Space：</strong>啟動按鈕和連結<br>&nbsp;• <strong>Escape：</strong>關閉對話框並返回焦點<br>&nbsp;• <strong>PIN輸入：</strong>0-9數字和Backspace<br>&nbsp;• <strong>表單控制項：</strong>原生鍵盤支援<br>&nbsp;• <strong>螢幕閱讀器：</strong>語義HTML含適當ARIA標籤和角色<br>&nbsp;• <strong>焦點管理：</strong>可見焦點指示器、邏輯Tab順序',
  },
};

// ─── State ────────────────────────────────────────────────────────────────────

const LANG_STORAGE_KEY = "yck_lang";
const SUPPORTED = ["en", "es", "ja", "zh-TW"];

function detectLanguage() {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
  } catch (_) {}
  const nav = (navigator.language || "en").toLowerCase();
  // Check full BCP47 tag first (e.g. "zh-TW"), then base language (e.g. "ja")
  if (SUPPORTED.includes(nav)) return nav;
  const base = nav.split("-")[0];
  return SUPPORTED.includes(base) ? base : "en";
}

let currentLang = detectLanguage();
let currentLocale = LOCALES[currentLang];

// Set <html lang> immediately on module load
document.documentElement.lang = currentLang;

// ─── Public API ───────────────────────────────────────────────────────────────

/** Change the active language and persist the choice. */
export function setLanguage(lang) {
  if (!SUPPORTED.includes(lang)) return;
  currentLang = lang;
  currentLocale = LOCALES[lang];
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch (_) {}
  document.documentElement.lang = lang;
}

/** Return the active language code. */
export function getLanguage() {
  return currentLang;
}

/** Return the list of supported language codes. */
export function getSupportedLanguages() {
  return [...SUPPORTED];
}

/**
 * Translate a key, interpolating {var} placeholders with `vars`.
 * Falls back to English, then to the raw key.
 */
export function t(key, vars) {
  let str = currentLocale[key] ?? LOCALES.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
  }
  return str;
}

/**
 * Plural-aware translate. Selects key_one / key_few / key_many based on `count`.
 * Falls back gracefully if a plural form is missing.
 */
export function tp(key, count, vars) {
  const form = (PLURAL_FN[currentLang] ?? pluralSimple)(count);
  const candidates = [`${key}_${form}`, `${key}_many`, `${key}_other`, key];
  let str = key; // final fallback
  for (const candidate of candidates) {
    const val = currentLocale[candidate] ?? LOCALES.en[candidate];
    if (val !== undefined) {
      str = val;
      break;
    }
  }
  const allVars = { n: count, ...vars };
  for (const [k, v] of Object.entries(allVars)) {
    str = str.replaceAll(`{${k}}`, String(v));
  }
  return str;
}

/**
 * Walk the DOM and replace text / attributes on elements carrying
 * data-i18n, data-i18n-placeholder, or data-i18n-aria attributes.
 */
export function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
  });
}
