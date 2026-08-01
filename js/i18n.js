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

    about_title: "About My Cycle Keeper",
    about_info:
      "My Cycle Keeper is a personal fork of Your Cycle Keeper, the open-source period tracker by pythonime-lab, with changes applied for personal preferences. If you find it helpful, consider supporting the original developer. Both projects are free forever with no ads, no tracking, and no data collection. Estimates are for personal information only — not for contraception.",
    fork_title: "About This Fork",
    fork_info:
      "This personal fork adds rolling 6-month predictions, in-app import from My Calendar and drip, export to drip or plain CSV, auto-fill, late-period messaging, themes, and compact history sharing. Some upstream features were removed. Use at your own risk.",

    support_title: "Support Development",
    support_info:
      "This app is a fork of Your Cycle Keeper by pythonime-lab. If you find it helpful, consider supporting the original developer!",

    disclaimer_title: "Medical Disclaimer",
    disclaimer_info:
      "⚠️ This app provides cycle estimations based on average biological patterns. It is not medical advice and must not be used as a substitute for professional medical consultation. My Cycle Keeper predicts your cycle by tracking patterns and estimating ovulation timing. Actual cycle timing can vary due to stress, illness, medications, and many other factors. Do not use this app as a contraceptive or fertility guarantee. Always consult a qualified healthcare professional for medical decisions.",

    accessibility_title: "Accessibility",
    accessibility_info:
      "My Cycle Keeper follows WCAG 2.0 accessibility standards: Tab/Shift+Tab: Navigate forward/backward through all interactive elements; Arrow Keys: Navigate calendar dates (complex grid component); Enter/Space: Activate buttons and links; Escape: Close modals and return focus to trigger element; PIN Entry: Type digits 0-9 and Backspace on all PIN screens; Form Controls: Native keyboard support for inputs, selects, and textareas; Screen Readers: Semantic HTML with proper ARIA labels and roles; Focus Management: Visible focus indicators, logical tab order. Standards based on Salesforce Accessibility Guidelines.",

    cycle_stats: "Cycle Stats",
    avg_length: "Avg Length",
    avg_length_rolling: "6-Mo Avg",
    avg_length_overall: "All-Time Avg",
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
      "My Cycle Keeper estimates upcoming period dates by identifying patterns in your recorded cycles. Predictions use a rolling 6-month average of your logged cycles. Cycles that differ from this average by more than 3 days are flagged. If your shortest and longest cycles in that window differ by more than 7 days (or more than 9 days, which may indicate irregular cycles per Cleveland Clinic guidance), you'll see a variability notice. Ovulation is estimated ~14 days before your next period. Fertile days are calculated as day 8 through (cycle length − 11).",
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
    status_period_late_one: "Your period is 1 day late",
    status_period_late_many: "Your period is {n} days late",
    status_period_expected_on:
      "Based on past records, your period was expected to begin on {date}",
    status_phase_line: "Phase {num} — {phase}  ·  {detail}",

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
    stat_rolling_title: "Last 6 Months",
    stat_rolling_hint: "Used for predictions",
    stat_overall_title: "All Time",
    stat_cycles_count: "Cycles",
    cycle_shift_longer:
      "Last cycle was {days} days longer than your 6-month average",
    cycle_shift_shorter:
      "Last cycle was {days} days shorter than your 6-month average",
    cycle_shift_tooltip: "{days} days from 6-month average",
    cycle_spread_caution:
      "Cycle length varies by {spread} days in the last 6 months ({min}–{max}d). Slight variation is normal.",
    cycle_spread_irregular:
      "Cycle length varies by {spread} days in the last 6 months ({min}–{max}d). Changes of more than 9 days between cycles may be irregular.",
    cycle_spread_caution_short: "Variable cycles: {spread}d spread (last 6 months)",
    cycle_spread_irregular_short: "Irregular pattern: {spread}d spread (last 6 months)",
    history_current: "In progress",
    legend_shifted: "Shifted (>3d from 6-mo avg)",

    // Phase badge labels (short, uppercase-safe)
    follicular: "Follicular",
    menstrual: "Menstrual",
    other_cycle_days: "Other cycle days",
    history_daily_pattern: "Daily pattern: flow, pain, and mood",

    // Auto-fill setting
    settings_autofill_label: "Auto-fill expected period days ahead",
    settings_autofill_hint:
      "Fills this many days after the period start day with light flow (e.g. 5 = start day + 5 more days = 6 days total). Leave blank for auto (avg period length from your last 6 months of logs). Set to 0 to disable.",
    settings_autofill_auto: "auto",
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
    theme_kawaii: "Pink Power",
    theme_custom: "Customize",

    // Theme customizer
    custom_theme_hint:
      "These start from the colours you were just viewing. Edits preview straight away. Save a preset to keep it while you try other themes.",
    custom_theme_base_label: "Start from",
    custom_theme_base_hint:
      "Changing this reloads that theme's colours as your starting point.",
    custom_theme_preview_label: "Calendar preview",
    custom_theme_preview_predicted: "Predicted",
    custom_theme_preview_tolerance: "Extra days",
    custom_theme_bg: "Page background",
    custom_theme_card: "Card background",
    custom_theme_text: "Text",
    custom_theme_text_muted: "Secondary text",
    custom_theme_accent: "Accent",
    custom_theme_accent_light: "Accent (light)",
    custom_theme_highlight: "Highlight",
    custom_theme_fertile: "Fertile days",
    custom_theme_ovulation: "Ovulation day",
    custom_theme_flow_start: "Flow gradient — light",
    custom_theme_flow_end: "Flow gradient — heavy",
    custom_theme_picker_hue: "Hue",
    custom_theme_picker_hint:
      "Drag in the gradient to set saturation and brightness. Use the hex field for an exact colour.",
    custom_theme_picker_close: "Close colour picker",
    custom_theme_picker_value:
      "{hex}; {saturation}% saturation; {brightness}% brightness",
    custom_theme_save: "Save preset",
    custom_theme_load: "Load saved preset",
    custom_theme_reset: "Reset to theme colours",
    custom_theme_saved: "Preset saved.",
    custom_theme_loaded: "Saved preset loaded.",
    custom_theme_none_saved: "No preset saved yet.",

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
    settings_show_fertility: "Show fertility estimates",
    settings_show_fertility_hint:
      "Shows estimated fertile and ovulation days in the calendar and Fertile Days in stats.",
    settings_show_cycle_timeline: "Show cycle phase timeline",
    settings_show_cycle_timeline_hint:
      "Shows the Menstrual, Follicular, Ovulation, and Luteal phases. Turn off for a simple period progress timeline.",
    settings_security_section: "Security & Privacy",
    settings_change_pin: "Change PIN",
    settings_export: "Export Encrypted Backup",
    settings_import: "Import Encrypted Backup",
    settings_import_app: "Import from another app",
    settings_export_app: "Export to another app",

    // Multi-app export wizard
    app_export_title: "Export to another app",
    app_export_format_intro: "Choose a format to download.",
    app_export_format_drip: "drip",
    app_export_format_plain: "Plain CSV",
    app_export_hint_drip: "drip-compatible CSV for re-import into drip.",
    app_export_hint_plain: "Simple spreadsheet with period dates, flow, pain, mood, and notes.",
    app_export_empty_title: "No data to export",
    app_export_empty_msg: "Log some cycle data first, then come back to export.",
    app_export_downloaded_toast: "Downloaded {filename}",
    app_export_failed_title: "Export failed",
    app_export_failed_msg: "Could not download the file. Please try again.",

    // Multi-app import wizard
    app_import_title: "Import from another app",
    app_import_source_intro: "Choose the app you exported from.",
    app_import_source_mycalendar: "My Calendar",
    app_import_source_drip: "drip",
    app_import_file_hint_mycalendar:
      "In My Calendar, go to Settings → Export document to Doctor. Then load the resulting .txt file here.",
    app_import_file_hint_drip:
      "In drip, tap the three dots in the top-right → Settings → Data. Then load the exported .csv file here.",
    app_import_choose_file: "Choose file",
    app_import_back: "Back",
    app_import_review_counts: "{periods} periods total, {withFlow} with identified source flow.",
    app_import_review_warning:
      "{count} periods have no flow — set a pattern to fill them, or continue to keep source data only.",
    app_import_pattern_label: "Flow pattern (1–4; 0 = spotting)",
    app_import_pattern_hint:
      "If the pattern is longer than a period, extra days are ignored. If it’s shorter, the last level repeats for the rest of the period.",
    app_import_flow_mode_legend: "When source flow exists",
    app_import_flow_overwrite: "Overwrite existing flow",
    app_import_flow_fill_gaps: "Only fill periods with no flow",
    app_import_continue: "Continue",
    app_import_report_unmapped: "Unmapped moods",
    app_import_report_leftovers: "Leftovers",
    app_import_copy: "Copy report",
    app_import_export_txt: "Export .txt",
    app_import_export_csv: "Export .csv",
    app_import_done: "Done",
    app_import_failed_title: "Import Failed",
    app_import_empty_title: "Nothing to Import",
    app_import_empty_msg: "The file contained no usable data.",
    app_import_done_msg: "{days} days imported successfully.",
    app_import_merge_title: "Import data",
    app_import_merge_msg: "Found {days} days to import. How would you like to apply?",
    app_import_merge: "Merge (keep my data)",
    app_import_replace: "Replace (use imported data)",
    app_import_report_summary_source: "Source: {source}",
    app_import_report_summary_periods: "Periods: {count}",
    app_import_report_summary_flow_days: "Days with flow: {count}",
    app_import_report_summary_mood_days: "Days with mood: {count}",
    app_import_report_summary_leftover_days: "Days with leftovers: {count}",
    app_import_report_summary_unmapped: "Unmapped moods: {count}",
    app_import_report_summary_imported: "Days imported: {count}",
    app_import_report_result:
      "Imported {days} period days across {periods} cycles.",
    app_import_report_extras_note:
      "Some details aren’t tracked here yet. They’re listed below — copy or export them if you want to save or add them as notes later.",
    app_import_copy_success: "Report copied to clipboard",
    app_import_copy_failed: "Could not copy report",

    // drip CSV import flow (legacy merge/replace labels)
    drip_import_title: "Import from drip",
    drip_import_panel_intro:
      "Import cycle history from a drip-compatible CSV file. In drip, go to Menu → Export Data → Export as CSV.",
    drip_import_panel_before:
      "My Calendar and drip exports can both be imported directly in Settings → Import from another app.",
    drip_import_choose_csv: "Choose CSV file",
    drip_import_mycalendar_label: "Using My Calendar instead of drip?",
    drip_import_mycalendar_link: "Import from another app in Settings →",
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
    settings_recalc_section: "Cycle History Maintenance",
    settings_recalc_hint:
      "Rebuilds your cycle history and predictions from your logged flow days. Use this if history or predictions ever look out of sync — it's safe and doesn't touch your logs.",
    settings_recalc_btn: "Recalculate Cycle History",
    settings_recalc_confirm_title: "Recalculate cycle history?",
    settings_recalc_confirm_msg:
      "This rebuilds your cycle history and predictions from your logged flow days. Your logs themselves won't be changed.",
    settings_recalc_confirm_btn: "Recalculate",
    settings_recalc_done_toast: "Cycle history recalculated",
    drive_section_title: "Google Drive backup",
    drive_section_desc:
      "Encrypted one-way backup to a hidden app-data folder in your Google Drive — <strong>not</strong> two-way sync. The app cannot access your other Drive files, and we have no server that can read your encrypted data. Logging on one device does not update another; use this to restore on a new phone or after clearing app data.",
    drive_test_user_note: "",
    drive_status_not_connected: "Not connected",
    drive_status_last_backup: "Last backed up: {date} · One-way backup only",
    drive_status_never_synced: "Connected — no backup uploaded yet",
    drive_connect_btn: "Connect Google Drive",
    drive_disconnect_btn: "Disconnect",
    drive_disconnect_confirm_btn: "Confirm disconnect",
    drive_disconnect_tap_again: "Tap again to confirm disconnect",
    drive_sync_now_btn: "Back up now",
    drive_auto_label: "Automatically back up after changes (when online)",
    drive_auto_hint:
      "Uploads a debounced encrypted backup after you save changes. Does not download or merge from other devices.",
    drive_not_configured:
      "Google Drive backup needs an OAuth Client ID and token proxy URL in js/drive-config.js (see drive-config.example.js and drive-oauth-proxy/README.md).",
    drive_connected_toast: "Google Drive connected",
    drive_disconnected_toast: "Google Drive disconnected",
    drive_disconnect_failed: "Could not disconnect. Try again.",
    drive_disconnecting: "Disconnecting…",
    drive_sync_success_toast: "Backup uploaded",
    drive_sync_not_connected:
      "Not connected to Google Drive. Tap Connect first.",
    drive_sync_not_unlocked: "Unlock the app with your PIN first.",
    drive_sync_offline: "You are offline.",
    drive_sync_failed_title: "Google Drive backup failed",
    drive_sync_failed_msg:
      "Could not complete the Google Drive backup. Check your connection and try again.",
    drive_oauth_state_mismatch:
      "Google sign-in could not be completed because the app lost track of the login session (common when opening from a home-screen shortcut). Close the app completely, open it again in your browser, then try Connect once more.",
    drive_oauth_redirect_mismatch:
      "Google rejected the sign-in (redirect URI mismatch). In Google Cloud Console → Credentials → your Web client, confirm this exact redirect URI is listed:\n\nhttps://period.fishese.cc/\n\nAlso confirm the client type is Web application (not Desktop).",
    drive_oauth_missing_secret:
      "Drive backup is not fully set up: deploy the token proxy (drive-oauth-proxy) with your Client secret, set DRIVE_TOKEN_PROXY_URL in drive-config.js, then hard-refresh. Never put the Client secret in the public app.",
    drive_oauth_invalid_grant:
      "Google would not accept the sign-in code — it may have expired or already been used. Tap Connect Google Drive once and complete the flow without refreshing the page.",
    drive_oauth_no_refresh:
      "Google did not grant offline access. Disconnect any previous attempt in Google Account → Security → Third-party access, then connect again.",
    drive_oauth_access_denied:
      "Google sign-in was cancelled or denied.",
    drive_oauth_enter_pin:
      "Enter your PIN to finish connecting Google Drive.",
    drive_oauth_code_expired:
      "Google sign-in timed out. Please tap Connect Google Drive and try again.",
    drive_reconnect_msg:
      "Google Drive access expired. Disconnect and connect again.",
    drive_disconnect_confirm_title: "Disconnect Google Drive?",
    drive_disconnect_confirm_msg:
      "This removes Google sign-in from this device. Your encrypted backup file stays in Google Drive until you delete it there.",
    drive_restore_found_title: "Restore from Google Drive?",
    drive_restore_found_msg:
      "A backup was found in your Google Drive. Restore it now? This will <strong>replace</strong> all data on this device. You’ll need your PIN.",
    drive_restore_confirm: "Restore backup",
    drive_restore_skip: "Keep local data",
    drive_restore_not_found_title: "No Google Drive backup found",
    drive_restore_not_found_msg:
      "Google Drive connected successfully, but no My Cycle Keeper backup was found.",

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
    ob_setup_title: "Set up your cycle",
    ob_setup_hint:
      "Add your last period for immediate predictions, or import existing data. You can also skip the date and start logging.",
    ob_continue_btn: "Continue →",
    onboard_restore_backup: "Restore encrypted backup",
    onboard_restore_drive: "Restore from Google Drive",
    ob_back_btn: "← Back",
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
    flow_spotting: "Spotting",
    flow_light: "Light",
    flow_medium: "Medium",
    flow_heavy: "Heavy",
    flow_very_heavy: "Very heavy",
    log_add_entry: "Add entry",
    log_edit_entry: "Edit entry",
    log_auto_save: "Changes save automatically",
    log_not_recorded: "Not recorded",
    log_clear: "Clear",
    log_none: "None",
    log_no_pain: "No pain",
    log_note: "Note",
    log_add_note: "Add note",
    log_delete_entry: "Delete entry",
    log_done: "Done",
    log_delete_title: "Delete this entry?",
    log_delete_message:
      "Flow, pain, mood, and notes recorded for this day will be removed.",
    log_entry_deleted: "Entry deleted",
    log_saved: "Saved ✓",
    log_saving: "Saving…",
    log_estimated_flow: "Estimated light flow — choose a value to confirm it.",
    print_options_title: "Print period history",
    print_options_intro:
      "Period dates and durations are always included. Additional details are optional.",
    print_options_symptoms: "Include symptom details",
    print_options_symptoms_hint: "Flow, pain, and mood summaries",
    print_options_notes: "Include notes",
    print_options_notes_hint: "Your private daily notes",
    continue: "Continue",

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
    history_col_dates: "Dates",
    history_col_period: "Period",
    history_col_cycle: "Cycle",
    view_all_history: "View all",
    share_history: "Share",
    share_history_subject: "My recent period dates",
    share_history_intro: "Last 6 periods (start–end):",
    share_history_empty: "No period history to share yet.",
    print_summary: "Print summary",
    print_summary_title: "My Cycle Keeper — Cycle Summary",
    print_summary_generated: "Generated on {date}",
    print_summary_stats_title: "Summary",
    print_summary_next_period: "Next Predicted Period",
    print_summary_col_symptoms: "Notes",
    print_summary_avg_pain: "Avg pain {value}/10",
    print_summary_avg_mood: "Avg mood {value}/100",
    print_summary_notes_count_one: "{n} note",
    print_summary_notes_count_many: "{n} notes",
    print_summary_disclaimer:
      "Generated from self-reported data for personal reference only. This is not medical advice — please consult a qualified healthcare professional for clinical decisions.",

    // History legend
    legend_short: "Short (<26d)",
    legend_normal: "Normal (26–32d)",
    legend_long: "Long (>32d)",
    legend_shifted: "Shifted (>3d from 6-mo avg)",
    history_current: "In progress",

    // Hardcoded HTML sections
    flow_question: "What's your flow today? 🌊",
    log_force_new_cycle: "This is a new period, not a continuation",
    log_force_new_cycle_hint:
      "Only applies if Flow is set. Use this to split off a new period the app would otherwise group with a recent one.",
    security_info:
      "All data is encrypted with your PIN before being stored. Cycle Keeper uses the <strong>Web Crypto API</strong> — the same standard used by browsers for HTTPS.<br><br>Zero data is sent to any server. No accounts. No analytics.",
    data_persistence:
      '⚠️ <strong>Data Persistence:</strong> Your data is stored in IndexedDB. Clearing browser cache is safe, but clearing "site data" or "cookies and site data" in your browser settings WILL erase all your cycle data. Always export a backup first!',
    about_info_html:
      '<strong>My Cycle Keeper</strong> is a personal fork of <a href="https://github.com/pythonime-lab/yourcyclekeeper" target="_blank" rel="noopener" class="accessibility-link">Your Cycle Keeper</a>, the open-source period tracker by <a href="https://github.com/pythonime-lab" target="_blank" rel="noopener" class="accessibility-link">pythonime-lab</a>, with changes applied for personal preferences.<br><br>If you find it helpful, consider supporting the original developer on <a href="https://github.com/pythonime-lab" target="_blank" rel="noopener" class="accessibility-link">GitHub</a>.<br><br>Both Your Cycle Keeper and this fork are free forever — no ads, no tracking, and no data collection. Estimates are for personal information only. Not for contraception. Stress, illness, and medications can shift timing.<br><br><strong>Version:</strong> 1.0.0-beta<br><strong>License:</strong> GNU General Public License v3.0',
    fork_title: "About This Fork",
    fork_info_html:
      'This personal fork adds rolling 6-month cycle predictions, in-app import from My Calendar and drip, export to drip or plain CSV, auto-fill for period days, late-period status messaging, themes/layout options, and compact cycle history with email sharing.<br><br>Some upstream features were removed; prediction ideas and CSV format were informed by <a href="https://gitlab.com/bloodyhealth/drip" target="_blank" rel="noopener" class="accessibility-link">drip</a> by bloodyhealth. Built with AI-assisted coding — <strong>use at your own risk.</strong><br><br><small style="color: var(--text-muted)"><a href="https://fishese.github.io/tools/" target="_blank" rel="noopener" class="accessibility-link">0oo.fish.oo0</a></small>',
    support_info:
      "This app is a fork of <strong>Your Cycle Keeper</strong> by pythonime-lab. If you find it helpful, consider supporting the original developer!",
    support_via: "Support via",
    support_footer:
      "Your support helps keep the original Your Cycle Keeper project maintained and ad-free. Thank you! 💜",
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
      "My Cycle Keeper прогнозирует даты следующих менструаций на основе закономерностей в записанных циклах. Овуляция оценивается ~ за 14 дней до следующей менструации. Фертильные дни рассчитываются по формуле: день 8 — (длина цикла − 11).",
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

    status_cycle_day_of: "День {day} вашего {total}-дневного цикла",
    status_period_today: "Менструация ожидается сегодня",
    status_period_soon_date: "Может начаться сегодня или около {date}",
    status_period_in_date: "Следующая менструация ожидается около {date}",
    status_period_late_one: "Ваша менструация задерживается на 1 день",
    status_period_late_few: "Ваша менструация задерживается на {n} дня",
    status_period_late_many: "Ваша менструация задерживается на {n} дней",
    status_period_expected_on:
      "По прошлым записям менструация должна была начаться {date}",
    status_phase_line: "Фаза {num} — {phase}  ·  {detail}",

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
    menstrual: "Менструальная",
    other_cycle_days: "Остальные дни цикла",
    history_daily_pattern: "По дням: выделения, боль и настроение",

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
    settings_show_fertility: "Показывать оценки фертильности",
    settings_show_fertility_hint:
      "Показывает предполагаемые фертильные дни и овуляцию в календаре, а также «Фертильные дни» в статистике.",
    settings_show_cycle_timeline: "Показывать временную шкалу фаз цикла",
    settings_show_cycle_timeline_hint:
      "Показывает менструальную, фолликулярную, овуляторную и лютеиновую фазы. Отключите для простой шкалы прогресса цикла.",
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
    flow_spotting: "Мазня",
    flow_light: "Слабые",
    flow_medium: "Умеренные",
    flow_heavy: "Обильные",
    flow_very_heavy: "Очень обильные",
    log_add_entry: "Добавить запись",
    log_edit_entry: "Изменить запись",
    log_auto_save: "Изменения сохраняются автоматически",
    log_not_recorded: "Не записано",
    log_clear: "Очистить",
    log_none: "Нет",
    log_no_pain: "Боли нет",
    log_note: "Заметка",
    log_add_note: "Добавить заметку",
    log_delete_entry: "Удалить запись",
    log_done: "Готово",
    log_delete_title: "Удалить эту запись?",
    log_delete_message: "Данные о выделениях, боли, настроении и заметки за этот день будут удалены.",
    log_entry_deleted: "Запись удалена",
    log_saved: "Сохранено ✓",
    log_saving: "Сохранение…",
    log_estimated_flow: "Предполагаемые слабые выделения — выберите значение, чтобы подтвердить.",
    print_options_title: "Печать истории менструаций",
    print_options_intro: "Даты и длительность включаются всегда. Остальные данные — по желанию.",
    print_options_symptoms: "Включить данные о симптомах",
    print_options_symptoms_hint: "Сводка выделений, боли и настроения",
    print_options_notes: "Включить заметки",
    print_options_notes_hint: "Ваши личные ежедневные заметки",
    continue: "Продолжить",

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

    status_cycle_day_of: "Дзень {day} вашага {total}-дзённага цыкла",
    status_period_today: "Менструацыя чакаецца сёння",
    status_period_soon_date: "Можа пачацца сёння або каля {date}",
    status_period_in_date: "Наступная менструацыя чакаецца каля {date}",
    status_period_late_one: "Ваша менструацыя затрымліваецца на 1 дзень",
    status_period_late_few: "Ваша менструацыя затрымліваецца на {n} дні",
    status_period_late_many: "Ваша менструацыя затрымліваецца на {n} дзён",
    status_period_expected_on:
      "Па мінулых запісах менструацыя павінна была пачацца {date}",
    status_phase_line: "Фаза {num} — {phase}  ·  {detail}",

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
    menstrual: "Менструальная",
    other_cycle_days: "Астатнія дні цыкла",
    history_daily_pattern: "Па днях: выдзяленні, боль і настрой",

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
    settings_show_fertility: "Паказваць ацэнкі фертыльнасці",
    settings_show_fertility_hint:
      "Паказвае меркаваныя фертыльныя дні і авуляцыю ў календары, а таксама «Фертыльныя дні» ў статыстыцы.",
    settings_show_cycle_timeline: "Паказваць шкалу фаз цыкла",
    settings_show_cycle_timeline_hint:
      "Паказвае менструальную, фалікулярную, авуляторную і лютэінавую фазы. Адключыце для простай шкалы прагрэсу цыкла.",
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
    flow_spotting: "Мазня",
    flow_light: "Слабыя",
    flow_medium: "Умераныя",
    flow_heavy: "Абутныя",
    flow_very_heavy: "Вельмі абутныя",
    log_add_entry: "Дадаць запіс",
    log_edit_entry: "Змяніць запіс",
    log_auto_save: "Змены захоўваюцца аўтаматычна",
    log_not_recorded: "Не запісана",
    log_clear: "Ачысціць",
    log_none: "Няма",
    log_no_pain: "Болю няма",
    log_note: "Нататка",
    log_add_note: "Дадаць нататку",
    log_delete_entry: "Выдаліць запіс",
    log_done: "Гатова",
    log_delete_title: "Выдаліць гэты запіс?",
    log_delete_message: "Даныя пра выдзяленні, боль, настрой і нататкі за гэты дзень будуць выдалены.",
    log_entry_deleted: "Запіс выдалены",
    log_saved: "Захавана ✓",
    log_saving: "Захаванне…",
    log_estimated_flow: "Меркаваныя слабыя выдзяленні — выберыце значэнне, каб пацвердзіць.",
    print_options_title: "Друк гісторыі менструацый",
    print_options_intro: "Даты і працягласць уключаюцца заўсёды. Астатнія даныя — па жаданні.",
    print_options_symptoms: "Уключыць даныя пра сімптомы",
    print_options_symptoms_hint: "Зводка выдзяленняў, болю і настрою",
    print_options_notes: "Уключыць нататкі",
    print_options_notes_hint: "Вашы асабістыя штодзённыя нататкі",
    continue: "Працягнуць",

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
    // About section (About, Privacy, Support, Disclaimer, Accessibility)
    about_tab_developer: "Desarrollador",
    about_tab_privacy: "Privacidad",
    about_tab_disclaimer: "Aviso",
    privacy_title: "Garantía de privacidad",
    privacy_info:
      "My Cycle Keeper no recopila ningún dato. Todos los datos se almacenan únicamente en tu dispositivo; no se utilizan servidores, cuentas ni almacenamiento en la nube; no hay análisis, seguimiento ni telemetría; no contiene anuncios ni código de terceros; nunca transmite datos; y la información se cifra con tu PIN mediante AES-256-GCM. Tus datos de salud te pertenecen exclusivamente.",

    about_title: "Acerca de My Cycle Keeper",
    about_info:
      "My Cycle Keeper es un fork personal de Your Cycle Keeper, el rastreador de períodos de código abierto de pythonime-lab, adaptado a preferencias personales. Si te resulta útil, considera apoyar al desarrollador original. Ambos proyectos son gratuitos para siempre, sin anuncios, seguimiento ni recopilación de datos. Las estimaciones son solo informativas y no deben usarse como método anticonceptivo.",
    fork_title: "Sobre este fork",
    fork_info:
      "Este fork personal añade predicciones basadas en un promedio móvil de 6 meses, importación desde My Calendar y drip, exportación a drip o CSV sencillo, completado automático, avisos de retraso, temas y un historial compacto para compartir. Se eliminaron algunas funciones del proyecto original. Úsalo bajo tu propia responsabilidad.",

    support_title: "Apoyar el desarrollo",
    support_info:
      "Esta app es un fork de <strong>Your Cycle Keeper</strong> de pythonime-lab. Si la encuentras útil, ¡considera apoyar al desarrollador original!",

    disclaimer_title: "Aviso médico",
    disclaimer_info:
      "⚠️ Esta aplicación ofrece estimaciones del ciclo basadas en patrones biológicos promedio. No constituye asesoramiento médico ni sustituye una consulta profesional. My Cycle Keeper predice el ciclo a partir de los patrones registrados y estima la ovulación. Las fechas reales pueden variar por el estrés, las enfermedades, los medicamentos y muchos otros factores. No uses esta aplicación como método anticonceptivo ni como garantía de fertilidad. Consulta a un profesional de la salud para tomar decisiones médicas.",

    accessibility_title: "Accesibilidad",
    accessibility_info:
      "My Cycle Keeper sigue los estándares de accesibilidad WCAG 2.0: Tab/Shift+Tab para recorrer los elementos interactivos; teclas de flecha para moverse por las fechas del calendario; Enter/Espacio para activar botones y enlaces; Escape para cerrar ventanas y devolver el foco; dígitos 0–9 y Retroceso en las pantallas del PIN; compatibilidad de teclado para controles de formulario; HTML semántico con etiquetas y roles ARIA; e indicadores de foco visibles con un orden de tabulación lógico. Basado en las directrices de accesibilidad de Salesforce.",

    cycle_stats: "Estadísticas del ciclo",
    avg_length: "Duración promedio",
    avg_length_rolling: "Prom. de 6 meses",
    avg_length_overall: "Prom. histórico",
    cycles_logged: "Ciclos registrados",
    avg_period: "Duración promedio",
    fertile_days: "Días fértiles",
    symptom_tracking: "Registro de síntomas",
    period: "Período",
    ovulation: "Ovulación",
    flow: "Flujo",
    pain: "Dolor",
    mood: "Ánimo",
    how_it_works: "Cómo funciona",
    how_it_works_p1:
      "My Cycle Keeper estima las fechas de tus próximas menstruaciones a partir de los patrones de los ciclos que has registrado. Las predicciones usan el promedio móvil de los últimos 6 meses de ciclos registrados. Los ciclos que se apartan de este promedio por más de 3 días se marcan. Si, dentro de ese período, la diferencia entre tu ciclo más corto y el más largo supera los 7 días (o los 9 días, lo que puede indicar ciclos irregulares según la orientación de Cleveland Clinic), verás un aviso de variabilidad. La ovulación se estima aproximadamente 14 días antes del próximo período. Los días fértiles se calculan desde el día 8 hasta el día correspondiente a la duración del ciclo menos 11.",
    how_it_works_p2:
      "Para ciclos regulares de 28 días, esto significa que los días 8–17 suelen ser fértiles, con ovulación alrededor del día 14.",
    disclaimer: "Aviso",
    estimation_disclaimer:
      "⚠️ Esta herramienta solo ofrece estimaciones. No debe usarse como método anticonceptivo. El estrés, las enfermedades y los medicamentos pueden alterar las fechas.",
    no_symptoms_logged: "Aún no hay síntomas registrados — comienza registrando hoy",
    cycle_history: "Historial del ciclo",
    all_months: "Todos los meses",
    cycle_day: "Día del ciclo",
    until_next: "Hasta el próximo período",
    day_1: "Día 1",
    avg_length_short: "Duración promedio",
    period_short: "Período",
    fertile: "Fértil",
    ovulation_short: "Ovulación",
    luteal: "Lútea",

    // Storage / init errors
    storage_error_title: "Error de almacenamiento",
    storage_error_msg: "No se pudo acceder al almacenamiento. Por favor, recarga la página.",
    db_error_title: "Error de base de datos",
    db_error_msg:
      "No se pudo inicializar el almacenamiento. Por favor, recarga la página.",

    // Lock screen / PIN
    unlock_subtitle: "Ingresa tu PIN para desbloquear tus datos privados de salud",
    too_many_attempts: "Demasiados intentos. Inténtalo en {secs}s.",
    locked_out: "🚫 Demasiados intentos. Bloqueado por 60 segundos.",
    lockout_ended: "Bloqueo finalizado. Inténtalo de nuevo.",
    incorrect_pin_one: "PIN incorrecto. Queda {remaining} intento.",
    incorrect_pin_many: "PIN incorrecto. Quedan {remaining} intentos.",
    decryption_failed: "Error de descifrado. Los datos pueden estar dañados.",
    error_try_again: "Ocurrió un error. Por favor, inténtalo de nuevo.",

    // Forgot PIN / reset
    forgot_pin_title: "¿Olvidaste el PIN?",
    forgot_pin_msg:
      "Esto eliminará permanentemente todos tus datos del ciclo y restablecerá My Cycle Keeper. No se puede deshacer. ¿Confirmas que deseas continuar?",
    forgot_pin_confirm: "Sí, borrar y restablecer",
    reset_complete_title: "Restablecimiento completado",
    reset_complete_msg:
      "My Cycle Keeper ha sido restablecido. Por favor, establece un nuevo PIN para comenzar.",
    reset_failed_title: "Error al restablecer",
    reset_failed_msg:
      "No se pudieron borrar los datos. Por favor, recarga la página e inténtalo de nuevo.",

    // Save / setup
    save_failed_title: "Error al guardar",
    save_failed_msg: "No se pudieron guardar los datos. Por favor, inténtalo de nuevo.",
    missing_date_title: "Fecha requerida",
    missing_date_msg: "Por favor, ingresa el primer día de tu último período.",
    set_pin_title: "Establece un PIN",
    set_pin_msg: "Ingresa un PIN de 4 dígitos para proteger tus datos.",
    setup_error_title: "Error de configuración",
    setup_error_msg:
      "No se pudo completar la configuración. Por favor, recarga la página e inténtalo de nuevo.",

    // Note
    note_count: "{count} / 500",
    note_placeholder: "Añadir una nota…",

    // Symptom modals
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

    // Reminder banner
    period_expected_in_one: "Se espera el período en {n} día",
    period_expected_in_many: "Se espera el período en {n} días",

    // Phase messages
    phase_menstruation: "Tu período 🩸",
    phase_follicular: "Fase folicular ✨",
    phase_fertile: "Días fértiles 🌿",
    phase_ovulation: "Día de ovulación 🌟",
    phase_luteal: "Fase lútea 🌙",

    // Phase subtitles
    subtitle_menstruation: "Día {day} de tu período",
    subtitle_fertile: "Los días {start}–{end} son fértiles",
    subtitle_ovulation: "Pico de fertilidad hoy",
    subtitle_other: "Próximo período en {n} días",

    // Status card – period info
    status_cycle_day_of: "Día {day} de tu ciclo de {total} días",
    status_period_today: "Se espera que tu período comience hoy",
    status_period_soon_date: "Podría comenzar hoy o cerca del {date}",
    status_period_in_date: "Se espera que el próximo período comience cerca del {date}",
    status_period_late_one: "Tu período lleva 1 día de retraso",
    status_period_late_many: "Tu período lleva {n} días de retraso",
    status_period_expected_on:
      "Según tus registros anteriores, se esperaba que tu período comenzara el {date}",
    status_phase_line: "Fase {num} — {phase}  ·  {detail}",

    // Status card
    now: "Ahora",
    bar_day: "Día {n}",

    // History / insights
    cycle_history_empty:
      "Registra al menos 2 fechas de inicio de período para ver el historial del ciclo.",
    history_days_one: "{n} día",
    history_days_many: "{n} días",
    no_data_yet: "Aún no hay datos registrados",

    // Chart labels
    chart_full_year: "Año completo {year}",
    chart_month_year: "{month} {year}",

    // Chart download errors
    download_failed_title: "Error al descargar",
    download_failed_msg: "No se pudo descargar el gráfico. Por favor, inténtalo de nuevo.",

    // Settings validation
    invalid_date_title: "Fecha inválida",
    invalid_date_msg: "Por favor, ingresa una fecha válida para el último período.",
    invalid_cycle_title: "Longitud de ciclo inválida",
    invalid_cycle_msg: "La longitud del ciclo debe estar entre 20 y 45 días.",
    invalid_duration_title: "Duración inválida",
    invalid_duration_msg: "La duración del período debe estar entre 1 y 10 días.",
    update_predictions_title: "¿Actualizar predicciones?",
    update_predictions_msg:
      "Esto recalculará todas las predicciones del ciclo con tu nueva configuración. Los síntomas y notas registrados no cambiarán. ¿Continuar?",
    update_predictions_confirm: "Sí, actualizar",

    // Backup status
    backup_never: "Última copia: nunca",
    backup_today: "Última copia: hoy",
    backup_yesterday: "Última copia: ayer",
    backup_days_ago_one: "Última copia: hace {n} día",
    backup_days_ago_many: "Última copia: hace {n} días",
    backup_overdue_one: "Última copia: hace {n} día — ¡vencida!",
    backup_overdue_many: "Última copia: hace {n} días — ¡vencida!",

    // Export/import
    export_backup_title: "Exportar copia de seguridad",
    export_backup_msg:
      "Tu copia de seguridad se exportará como un archivo cifrado. Solo puede descifrarse con tu PIN. Mantenla privada.",
    export: "Exportar",
    export_failed_title: "Error al exportar",
    export_failed_msg: "No se pudo exportar la copia de seguridad. Por favor, inténtalo de nuevo.",
    enter_backup_pin_title: "Ingresar PIN de copia de seguridad",
    enter_backup_pin_msg:
      "Ingresa el PIN que estaba activo cuando se creó esta copia de seguridad.",
    incorrect_pin_simple: "PIN incorrecto. Inténtalo de nuevo.",
    restored_title: "Restaurado",
    restored_msg: "Tu copia de seguridad se ha restaurado correctamente.",
    invalid_backup_title: "Copia de seguridad inválida",
    invalid_backup_msg: "Este formato de copia de seguridad no es compatible.",
    import_failed_title: "Error al importar",
    import_failed_msg: "No se pudo leer el archivo de copia de seguridad. Asegúrate de que sea válido.",

    // Storage info
    storage_used: "{sizeKB} KB (IndexedDB)",
    storage_unknown: "Desconocido",

    // Erase data
    erase_title: "Borrar todos los datos",
    erase_msg:
      "Esto eliminará permanentemente todos tus datos del ciclo y no se puede deshacer. ¿Confirmas que deseas continuar?",
    erase_confirm: "Sí, borrar todo",
    erase_failed_title: "Error al borrar",
    erase_failed_msg: "No se pudieron borrar los datos. Por favor, inténtalo de nuevo.",

    // Change PIN
    confirm_new_pin: "Confirmar nuevo PIN",
    enter_new_pin: "Ingresar nuevo PIN",
    reenter_pin_msg: "Vuelve a ingresar tu nuevo PIN para confirmar.",
    choose_pin_msg: "Elige un PIN de 4 dígitos.",
    pins_no_match: "Los PIN no coinciden. Inténtalo de nuevo.",
    pin_changed_title: "PIN cambiado",
    pin_changed_msg:
      "Tu PIN ha sido actualizado y todos los datos han sido cifrados nuevamente.\n\nNota: las copias de seguridad anteriores a este cambio aún requerirán tu PIN anterior para restaurarse.",
    pin_change_failed_title: "Error al cambiar el PIN",
    pin_change_failed_msg: "No se pudo actualizar el PIN. Por favor, inténtalo de nuevo.",

    // Calendar aria-labels
    calendar_day_period: "día de período",
    calendar_day_ovulation: "día de ovulación",
    calendar_day_fertile: "día fértil",
    calendar_day_regular: "día normal",
    calendar_day_period_possible: "posible día de período",

    // Statistical cycle tracking (shown in Insights once 3+ cycles tracked)
    stat_std_dev: "Desviación estándar",
    stat_range: "Rango del ciclo",
    stat_prediction_window: "Margen de predicción",
    stat_regularity: "Regularidad",
    stat_regular: "Regular",
    stat_variable: "Variable",
    stat_rolling_title: "Últimos 6 meses",
    stat_rolling_hint: "Se usa para las predicciones",
    stat_overall_title: "Todo el historial",
    stat_cycles_count: "Ciclos",
    cycle_shift_longer:
      "El último ciclo duró {days} días más que tu promedio de 6 meses",
    cycle_shift_shorter:
      "El último ciclo duró {days} días menos que tu promedio de 6 meses",
    cycle_shift_tooltip: "Diferencia de {days} días respecto al promedio de 6 meses",
    cycle_spread_caution:
      "En los últimos 6 meses, la duración del ciclo varió {spread} días ({min}–{max} días). Una variación leve es normal.",
    cycle_spread_irregular:
      "En los últimos 6 meses, la duración del ciclo varió {spread} días ({min}–{max} días). Las diferencias de más de 9 días entre ciclos pueden indicar irregularidad.",
    cycle_spread_caution_short: "Ciclos variables: diferencia de {spread} d (últimos 6 meses)",
    cycle_spread_irregular_short: "Patrón irregular: diferencia de {spread} d (últimos 6 meses)",
    history_current: "En curso",
    legend_shifted: "Desviado (>3 d respecto al prom. de 6 meses)",

    // Phase badge labels (short, uppercase-safe)
    follicular: "Folicular",
    menstrual: "Menstrual",
    other_cycle_days: "Otros días del ciclo",
    history_daily_pattern: "Patrón diario: flujo, dolor y estado de ánimo",

    // Auto-fill setting
    settings_autofill_label: "Completar automáticamente los días previstos del período",
    settings_autofill_hint:
      "Añade flujo ligero durante esta cantidad de días después del inicio del período (p. ej., 5 = día de inicio + 5 días más = 6 días en total). Déjalo en blanco para calcularlo automáticamente según la duración promedio de los períodos registrados en los últimos 6 meses. Introduce 0 para desactivarlo.",
    settings_autofill_auto: "automático",
    autofill_banner_msg_one: "Se completó automáticamente {n} día adicional con flujo ligero.",
    autofill_banner_msg_many: "Se completaron automáticamente {n} días adicionales con flujo ligero.",
    autofill_banner_settings: "Ajustar en Configuración",
    autofill_banner_backup_pre: "Recuerda ",
    autofill_banner_backup: "hacer una copia de seguridad",

    // Theme picker
    settings_theme_label: "Tema",
    theme_default: "YCK clásico",
    theme_light: "Newsroom claro",
    theme_dark: "Newsroom oscuro",
    theme_kawaii: "Poder rosa",
    theme_custom: "Personalizar",

    // Theme customizer
    custom_theme_hint:
      "Empiezan con los colores que estabas viendo. Los cambios se previsualizan al instante. Guarda un preajuste para conservarlo mientras pruebas otros temas.",
    custom_theme_base_label: "Partir de",
    custom_theme_base_hint:
      "Cambiar esto recarga los colores de ese tema como punto de partida.",
    custom_theme_preview_label: "Vista previa del calendario",
    custom_theme_preview_predicted: "Previsto",
    custom_theme_preview_tolerance: "Días extra",
    custom_theme_bg: "Fondo de página",
    custom_theme_card: "Fondo de tarjeta",
    custom_theme_text: "Texto",
    custom_theme_text_muted: "Texto secundario",
    custom_theme_accent: "Color principal",
    custom_theme_accent_light: "Color principal (claro)",
    custom_theme_highlight: "Resalte",
    custom_theme_fertile: "Días fértiles",
    custom_theme_ovulation: "Día de ovulación",
    custom_theme_flow_start: "Degradado de flujo — leve",
    custom_theme_flow_end: "Degradado de flujo — abundante",
    custom_theme_picker_hue: "Tono",
    custom_theme_picker_hint:
      "Arrastra por el degradado para ajustar la saturación y el brillo. Usa el campo hexadecimal para un color exacto.",
    custom_theme_picker_close: "Cerrar el selector de color",
    custom_theme_picker_value:
      "{hex}; {saturation}% de saturación; {brightness}% de brillo",
    custom_theme_save: "Guardar preajuste",
    custom_theme_load: "Cargar preajuste guardado",
    custom_theme_reset: "Restablecer colores del tema",
    custom_theme_saved: "Preajuste guardado.",
    custom_theme_loaded: "Preajuste guardado cargado.",
    custom_theme_none_saved: "Aún no hay ningún preajuste guardado.",

    // Language switcher
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

    // Settings HTML labels
    settings_cycle_tab: "Configuración del ciclo",
    settings_layout_tab: "Apariencia",
    settings_security_tab: "Seguridad",
    settings_calendar_display: "Calendario",
    settings_cycle_section: "Configuración del ciclo",
    settings_last_period: "Fecha de inicio del último período",
    settings_cycle_length: "Duración promedio del ciclo (días)",
    settings_period_duration: "Duración del período (días)",
    settings_update_btn: "Actualizar predicciones",
    settings_tolerance: "Margen de predicción (días)",
    settings_tolerance_hint: "Días que se muestran antes y después de cada período previsto en el calendario. Déjalo en blanco para calcularlo automáticamente según la regularidad de tu ciclo.",
    save: "Guardar",
    settings_show_fertility: "Mostrar estimaciones de fertilidad",
    settings_show_fertility_hint:
      "Muestra los días fértiles y de ovulación estimados en el calendario, y Días fértiles en las estadísticas.",
    settings_show_cycle_timeline: "Mostrar cronología de fases del ciclo",
    settings_show_cycle_timeline_hint:
      "Muestra las fases menstrual, folicular, de ovulación y lútea. Desactívala para ver una cronología simple del progreso del ciclo.",
    settings_security_section: "Seguridad y privacidad",
    settings_change_pin: "Cambiar PIN",
    settings_export: "Exportar copia de seguridad cifrada",
    settings_import: "Importar copia de seguridad cifrada",
    settings_import_app: "Importar desde otra app",
    settings_export_app: "Exportar a otra app",

    // Multi-app export wizard
    app_export_title: "Exportar a otra app",
    app_export_format_intro: "Elige un formato para descargar.",
    app_export_format_drip: "drip",
    app_export_format_plain: "CSV simple",
    app_export_hint_drip: "CSV compatible con drip para volver a importar en drip.",
    app_export_hint_plain: "Hoja de cálculo sencilla con las fechas del período, el flujo, el dolor, el estado de ánimo y las notas.",
    app_export_empty_title: "No hay datos para exportar",
    app_export_empty_msg: "Registra algunos datos del ciclo primero y vuelve para exportar.",
    app_export_downloaded_toast: "Descargado {filename}",
    app_export_failed_title: "Error al exportar",
    app_export_failed_msg: "No se pudo descargar el archivo. Por favor, inténtalo de nuevo.",

    // Multi-app import wizard
    app_import_title: "Importar desde otra app",
    app_import_source_intro: "Elige la aplicación desde la que exportaste los datos.",
    app_import_source_mycalendar: "My Calendar",
    app_import_source_drip: "drip",
    app_import_file_hint_mycalendar:
      "En My Calendar, ve a Configuración → Exportar documento para el médico. Después, carga aquí el archivo .txt generado.",
    app_import_file_hint_drip:
      "En drip, pulsa el menú de tres puntos de la esquina superior derecha y ve a Configuración → Datos. Después, carga aquí el archivo .csv exportado.",
    app_import_choose_file: "Elegir archivo",
    app_import_back: "Atrás",
    app_import_review_counts: "{periods} períodos en total; {withFlow} con datos de flujo identificados en el archivo de origen.",
    app_import_review_warning:
      "{count} períodos no tienen datos de flujo. Define un patrón para completarlos o continúa para conservar únicamente los datos del archivo de origen.",
    app_import_pattern_label: "Patrón de flujo (1–4; 0 = manchado)",
    app_import_pattern_hint:
      "Si el patrón es más largo que un período, se omitirán los días sobrantes. Si es más corto, el último nivel se repetirá durante el resto del período.",
    app_import_flow_mode_legend: "Cuando el archivo de origen incluye datos de flujo",
    app_import_flow_overwrite: "Sobrescribir el flujo existente",
    app_import_flow_fill_gaps: "Completar solo los períodos sin datos de flujo",
    app_import_continue: "Continuar",
    app_import_report_unmapped: "Estados de ánimo sin correspondencia",
    app_import_report_leftovers: "Otros datos",
    app_import_copy: "Copiar informe",
    app_import_export_txt: "Exportar .txt",
    app_import_export_csv: "Exportar .csv",
    app_import_done: "Listo",
    app_import_failed_title: "Error al importar",
    app_import_empty_title: "No hay nada que importar",
    app_import_empty_msg: "El archivo no contenía datos utilizables.",
    app_import_done_msg: "Se importaron correctamente {days} días.",
    app_import_merge_title: "Importar datos",
    app_import_merge_msg: "Se encontraron {days} días para importar. ¿Cómo deseas aplicarlos?",
    app_import_merge: "Combinar (conservar mis datos)",
    app_import_replace: "Reemplazar (usar los datos importados)",
    app_import_report_summary_source: "Origen: {source}",
    app_import_report_summary_periods: "Períodos: {count}",
    app_import_report_summary_flow_days: "Días con flujo: {count}",
    app_import_report_summary_mood_days: "Días con estado de ánimo: {count}",
    app_import_report_summary_leftover_days: "Días con otros datos: {count}",
    app_import_report_summary_unmapped: "Estados de ánimo sin correspondencia: {count}",
    app_import_report_summary_imported: "Días importados: {count}",
    app_import_report_result:
      "Se importaron {days} días de período correspondientes a {periods} ciclos.",
    app_import_report_extras_note:
      "Algunos detalles todavía no se registran en esta aplicación. Se muestran a continuación; puedes copiarlos o exportarlos para conservarlos o añadirlos más adelante como notas.",
    app_import_copy_success: "Informe copiado al portapapeles",
    app_import_copy_failed: "No se pudo copiar el informe",

    // drip CSV import flow (legacy merge/replace labels)
    drip_import_title: "Importar desde drip",
    drip_import_panel_intro:
      "Importa el historial del ciclo desde un archivo CSV compatible con drip. En drip, ve a Menú → Exportar datos → Exportar como CSV.",
    drip_import_panel_before:
      "Los archivos exportados por My Calendar y drip pueden importarse directamente desde Configuración → Importar desde otra app.",
    drip_import_choose_csv: "Elegir archivo CSV",
    drip_import_mycalendar_label: "¿Usas My Calendar en lugar de drip?",
    drip_import_mycalendar_link: "Importar desde otra app en Configuración →",
    drip_import_found: "Se encontraron {days} días de datos, incluidos {periods} días con flujo. ¿Cómo deseas importarlos?",
    drip_import_merge: "Combinar (conservar mis datos)",
    drip_import_replace: "Reemplazar (usar los datos de drip)",
    drip_import_done_title: "Importación completada",
    drip_import_done_msg: "Se importaron correctamente {days} días.",
    drip_import_failed_title: "Error al importar",
    drip_import_failed_msg: "No se pudo leer el archivo. Comprueba que sea un CSV exportado por drip.",
    drip_import_empty_title: "No hay nada que importar",
    drip_import_empty_msg: "El archivo no contenía datos utilizables.",
    settings_storage_label: "Almacenamiento usado:",
    settings_storage_calculating: "Calculando...",
    settings_erase: "Borrar todos los datos",
    settings_recalc_section: "Mantenimiento del historial de ciclos",
    settings_recalc_hint:
      "Reconstruye tu historial de ciclos y predicciones a partir de tus días de flujo registrados. Úsalo si el historial o las predicciones parecen desincronizados — es seguro y no afecta tus registros.",
    settings_recalc_btn: "Recalcular historial de ciclos",
    settings_recalc_confirm_title: "¿Recalcular historial de ciclos?",
    settings_recalc_confirm_msg:
      "Esto reconstruirá tu historial de ciclos y predicciones a partir de tus días de flujo registrados. Tus registros no se modificarán.",
    settings_recalc_confirm_btn: "Recalcular",
    settings_recalc_done_toast: "Historial de ciclos recalculado",
    drive_section_title: "Copia de seguridad en Google Drive",
    drive_section_desc:
      "Copia de seguridad cifrada y unidireccional en una carpeta oculta de datos de la aplicación dentro de Google Drive; <strong>no</strong> es una sincronización bidireccional. La aplicación no puede acceder a tus demás archivos de Drive y no tenemos ningún servidor capaz de leer tus datos cifrados. Los registros de un dispositivo no se actualizan en otro. Usa esta función para restaurar los datos en un teléfono nuevo o después de borrar los datos de la aplicación.",
    drive_test_user_note: "",
    drive_status_not_connected: "No conectado",
    drive_status_last_backup: "Última copia: {date} · Solo copia unidireccional",
    drive_status_never_synced: "Conectado — todavía no se ha subido ninguna copia",
    drive_connect_btn: "Conectar Google Drive",
    drive_disconnect_btn: "Desconectar",
    drive_disconnect_confirm_btn: "Confirmar desconexión",
    drive_disconnect_tap_again: "Pulsa otra vez para confirmar",
    drive_sync_now_btn: "Crear copia ahora",
    drive_auto_label: "Crear una copia automáticamente después de los cambios (con conexión)",
    drive_auto_hint:
      "Sube una copia cifrada poco después de guardar cambios. No descarga ni combina datos de otros dispositivos.",
    drive_not_configured:
      "La copia de seguridad de Google Drive requiere un ID de cliente OAuth y la URL del proxy de tokens en js/drive-config.js (consulta drive-config.example.js y drive-oauth-proxy/README.md).",
    drive_connected_toast: "Google Drive conectado",
    drive_disconnected_toast: "Google Drive desconectado",
    drive_disconnect_failed: "No se pudo desconectar. Inténtalo de nuevo.",
    drive_disconnecting: "Desconectando…",
    drive_sync_success_toast: "Copia de seguridad subida",
    drive_sync_not_connected:
      "Google Drive no está conectado. Pulsa Conectar primero.",
    drive_sync_not_unlocked: "Desbloquea la app con tu PIN primero.",
    drive_sync_offline: "Sin conexión.",
    drive_sync_failed_title: "Error en la copia de seguridad de Google Drive",
    drive_sync_failed_msg:
      "No se pudo completar la copia de seguridad de Google Drive. Comprueba tu conexión e inténtalo de nuevo.",
    drive_oauth_state_mismatch:
      "No se pudo completar el inicio de sesión de Google porque la app perdió la sesión de autorización (suele pasar con el acceso directo desde la pantalla de inicio). Cierra la app por completo, ábrela en el navegador e intenta Conectar otra vez.",
    drive_oauth_redirect_mismatch:
      "Google rechazó el inicio de sesión (URI de redirección no coincide). En Google Cloud Console → Credenciales → tu cliente Web, confirma esta URI exacta:\n\nhttps://period.fishese.cc/\n\nTambién confirma que el tipo es Aplicación web (no Escritorio).",
    drive_oauth_missing_secret:
      "La copia en Drive no está completa: despliega el proxy de tokens (drive-oauth-proxy) con el secreto de cliente, pon DRIVE_TOKEN_PROXY_URL en drive-config.js y recarga. Nunca pongas el secreto en la app pública.",
    drive_oauth_invalid_grant:
      "Google no aceptó el código de autorización — puede haber caducado o haberse usado ya. Pulsa Conectar Google Drive una vez y completa el flujo sin actualizar la página.",
    drive_oauth_no_refresh:
      "Google no concedió acceso sin conexión. Revoca el acceso anterior en Cuenta de Google → Seguridad → Acceso de terceros y vuelve a conectar.",
    drive_oauth_access_denied:
      "Se canceló o denegó el inicio de sesión de Google.",
    drive_oauth_enter_pin:
      "Introduce tu PIN para terminar de conectar Google Drive.",
    drive_oauth_code_expired:
      "El inicio de sesión de Google caducó. Pulsa Conectar Google Drive e inténtalo de nuevo.",
    drive_reconnect_msg:
      "El acceso a Google Drive expiró. Desconecta y vuelve a conectar.",
    drive_disconnect_confirm_title: "¿Desconectar Google Drive?",
    drive_disconnect_confirm_msg:
      "Quita el inicio de sesión de Google de este dispositivo. Tu copia cifrada permanece en Google Drive hasta que la borres allí.",
    drive_restore_found_title: "¿Restaurar desde Google Drive?",
    drive_restore_found_msg:
      "Se encontró una copia en tu Google Drive. ¿Restaurarla ahora? Esto <strong>reemplazará</strong> todos los datos de este dispositivo. Necesitarás tu PIN.",
    drive_restore_confirm: "Restaurar copia de seguridad",
    drive_restore_skip: "Mantener datos locales",
    drive_restore_not_found_title: "No se encontró una copia de seguridad en Google Drive",
    drive_restore_not_found_msg:
      "Google Drive se conectó correctamente, pero no se encontró ninguna copia de seguridad de My Cycle Keeper.",

    // Onboarding
    onboard_sub: "Rastrea tu período y ciclo de forma privada",
    onboard_tagline:
      "Registra el flujo, el estado de ánimo y los síntomas, todo en tu dispositivo. Gratis, sin anuncios, accesible y centrado en la privacidad.",
    beta_label: "Beta",
    beta_warning_text:
      "Esta aplicación se encuentra en desarrollo activo. Las funciones pueden cambiar y podrían producirse errores.",
    ob_last_period: "Primer día de tu último período",
    ob_cycle_len: "Duración promedio del ciclo (días)",
    ob_period_dur: "Duración promedio del período (días)",
    ob_setup_title: "Configura tu ciclo",
    ob_setup_hint:
      "Registra tu último período para obtener predicciones de inmediato o importa datos existentes. También puedes omitir la fecha y empezar a registrar.",
    ob_continue_btn: "Continuar →",
    onboard_restore_backup: "Restaurar copia cifrada",
    onboard_restore_drive: "Restaurar desde Google Drive",
    ob_back_btn: "← Atrás",
    pin_setup_title: "🔒 Establece un PIN de 4 dígitos",
    pin_setup_sub_1: "Tu PIN cifra todos los datos localmente.",
    pin_setup_sub_2: "My Cycle Keeper nunca envía tus datos a ningún servidor.",
    pin_setup_sub_3: "Si olvidas tu PIN, se borrarán los datos.",
    onboard_start_btn: "Empezar a registrar",
    privacy_note_aes: "Cifrado AES-256-GCM.",
    privacy_note_rest:
      "Los datos nunca salen de tu dispositivo. Sin cuentas, sin rastreo, gratis para siempre.",
    timeout_before: "⏱️ La sesión expira en",
    timeout_after: "s de inactividad — toca para restablecer",

    // Flow labels
    flow_spotting: "Manchado",
    flow_light: "Ligero",
    flow_medium: "Moderado",
    flow_heavy: "Abundante",
    flow_very_heavy: "Muy abundante",
    log_add_entry: "Añadir registro",
    log_edit_entry: "Editar registro",
    log_auto_save: "Los cambios se guardan automáticamente",
    log_not_recorded: "Sin registrar",
    log_clear: "Borrar",
    log_none: "Ninguno",
    log_no_pain: "Sin dolor",
    log_note: "Nota",
    log_add_note: "Añadir nota",
    log_delete_entry: "Eliminar registro",
    log_done: "Listo",
    log_delete_title: "¿Eliminar este registro?",
    log_delete_message:
      "Se eliminarán el flujo, el dolor, el estado de ánimo y las notas de este día.",
    log_entry_deleted: "Registro eliminado",
    log_saved: "Guardado ✓",
    log_saving: "Guardando…",
    log_estimated_flow: "Flujo ligero estimado: elige un valor para confirmarlo.",
    print_options_title: "Imprimir historial de períodos",
    print_options_intro:
      "Las fechas y duraciones siempre se incluyen. Los demás datos son opcionales.",
    print_options_symptoms: "Incluir detalles de síntomas",
    print_options_symptoms_hint: "Resumen de flujo, dolor y estado de ánimo",
    print_options_notes: "Incluir notas",
    print_options_notes_hint: "Tus notas diarias privadas",
    continue: "Continuar",

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
    predictions_tab: "Próximos períodos",
    predictions_empty: "Registra al menos una fecha de inicio del período para ver las predicciones.",
    history_col_start: "Inicio",
    history_col_end: "Fin",
    history_col_dates: "Fechas",
    history_col_period: "Período",
    history_col_cycle: "Ciclo",
    view_all_history: "Ver todo",
    share_history: "Compartir",
    share_history_subject: "Fechas recientes de mi período",
    share_history_intro: "Últimos 6 períodos (inicio–fin):",
    share_history_empty: "Aún no hay historial de períodos para compartir.",
    print_summary: "Imprimir resumen",
    print_summary_title: "My Cycle Keeper — Resumen del ciclo",
    print_summary_generated: "Generado el {date}",
    print_summary_stats_title: "Resumen",
    print_summary_next_period: "Próximo período estimado",
    print_summary_col_symptoms: "Notas",
    print_summary_avg_pain: "Dolor prom. {value}/10",
    print_summary_avg_mood: "Ánimo prom. {value}/100",
    print_summary_notes_count_one: "{n} nota",
    print_summary_notes_count_many: "{n} notas",
    print_summary_disclaimer:
      "Generado a partir de los datos que registraste y únicamente para consulta personal. No constituye asesoramiento médico; consulta a un profesional de la salud para tomar decisiones clínicas.",

    // History legend
    legend_short: "Corto (<26d)",
    legend_normal: "Normal (26–32d)",
    legend_long: "Largo (>32d)",
    legend_shifted: "Desviado (>3 d respecto al prom. de 6 meses)",
    history_current: "En curso",

    // Hardcoded HTML sections
    flow_question: "¿Cómo es tu flujo hoy? 🌊",
    log_force_new_cycle: "Este es un período nuevo, no una continuación",
    log_force_new_cycle_hint:
      "Solo se aplica cuando se ha indicado el flujo. Úsalo para separar un período nuevo que, de otro modo, la aplicación agruparía con uno reciente.",
    security_info:
      "Todos los datos se cifran con tu PIN antes de almacenarse. Cycle Keeper utiliza la <strong>Web Crypto API</strong>, el mismo estándar que emplean los navegadores para HTTPS.<br><br>No se envía ningún dato a servidores. No hay cuentas ni análisis de uso.",
    data_persistence:
      '⚠️ <strong>Persistencia de datos:</strong> Tus datos se almacenan en IndexedDB. Limpiar el caché del navegador es seguro, pero limpiar los "datos del sitio" o "cookies y datos del sitio" en la configuración del navegador BORRARÁ todos tus datos del ciclo. ¡Siempre exporta una copia de seguridad primero!',
    about_info_html:
      "<strong>My Cycle Keeper</strong> es un fork personal de <a href=\"https://github.com/pythonime-lab/yourcyclekeeper\" target=\"_blank\" rel=\"noopener\" class=\"accessibility-link\">Your Cycle Keeper</a>, el rastreador de períodos de código abierto de <a href=\"https://github.com/pythonime-lab\" target=\"_blank\" rel=\"noopener\" class=\"accessibility-link\">pythonime-lab</a>, adaptado a preferencias personales.<br><br>Si te resulta útil, considera apoyar al desarrollador original en <a href=\"https://github.com/pythonime-lab\" target=\"_blank\" rel=\"noopener\" class=\"accessibility-link\">GitHub</a>.<br><br>Tanto Your Cycle Keeper como este fork son gratuitos para siempre, sin anuncios, seguimiento ni recopilación de datos. Las estimaciones son solo informativas. No debe usarse como método anticonceptivo. El estrés, las enfermedades y los medicamentos pueden alterar las fechas.<br><br><strong>Versión:</strong> 1.0.0-beta<br><strong>Licencia:</strong> GNU General Public License v3.0",
    fork_title: "Sobre este fork",
    fork_info_html:
      "Este fork personal añade predicciones basadas en un promedio móvil de 6 meses, importación desde My Calendar y drip, exportación a drip o CSV sencillo, completado automático de los días del período, avisos de retraso, opciones de tema y diseño, y un historial compacto que se puede compartir por correo.<br><br>Se eliminaron algunas funciones del proyecto original. Las ideas de predicción y el formato CSV se basaron en <a href=\"https://gitlab.com/bloodyhealth/drip\" target=\"_blank\" rel=\"noopener\" class=\"accessibility-link\">drip</a>, de bloodyhealth. Desarrollado con ayuda de IA; <strong>úsalo bajo tu propia responsabilidad.</strong><br><br><small style=\"color: var(--text-muted)\"><a href=\"https://fishese.github.io/tools/\" target=\"_blank\" rel=\"noopener\" class=\"accessibility-link\">0oo.fish.oo0</a></small>",
    support_info:
      "Esta app es un fork de <strong>Your Cycle Keeper</strong> de pythonime-lab. Si la encuentras útil, ¡considera apoyar al desarrollador original!",
    support_via: "Apoyar vía",
    support_footer:
      "Tu apoyo ayuda a mantener el proyecto original Your Cycle Keeper y a que siga siendo gratuito y sin anuncios. ¡Gracias! 💜",
    privacy_info_html:
      "My Cycle Keeper no recopila <strong>ningún dato</strong>. Esta aplicación:<br>&nbsp;• Almacena todos los datos únicamente en tu dispositivo<br>&nbsp;• No utiliza servidores, cuentas ni almacenamiento en la nube<br>&nbsp;• No incluye análisis, seguimiento ni telemetría<br>&nbsp;• No contiene anuncios ni código de terceros<br>&nbsp;• Nunca transmite datos<br>&nbsp;• Cifra la información con tu PIN mediante AES-256-GCM<br><br>Tus datos de salud te pertenecen exclusivamente.",
    disclaimer_info_html:
      "⚠️ <strong>Esta aplicación ofrece estimaciones del ciclo basadas en patrones biológicos promedio.</strong> <em>No</em> constituye asesoramiento médico ni sustituye una consulta con un profesional de la salud.<br><br>My Cycle Keeper predice el ciclo a partir de los patrones registrados y estima la fecha de ovulación. Las fechas reales pueden variar debido al estrés, las enfermedades, los medicamentos y muchos otros factores.<br><br><strong>No</strong> uses esta aplicación como método anticonceptivo ni como garantía de fertilidad. Consulta a un profesional de la salud para tomar decisiones médicas.",
    accessibility_info_html:
      "My Cycle Keeper sigue los <strong>estándares de accesibilidad WCAG 2.0</strong>:<br><br>&nbsp;• <strong>Tab/Shift+Tab:</strong> recorrer hacia delante o hacia atrás todos los elementos interactivos<br>&nbsp;• <strong>Teclas de flecha:</strong> desplazarse por las fechas del calendario<br>&nbsp;• <strong>Enter/Espacio:</strong> activar botones y enlaces<br>&nbsp;• <strong>Escape:</strong> cerrar ventanas y devolver el foco al elemento que las abrió<br>&nbsp;• <strong>Entrada del PIN:</strong> usar los dígitos 0–9 y Retroceso en todas las pantallas del PIN<br>&nbsp;• <strong>Controles de formulario:</strong> compatibilidad nativa con teclado para campos, listas y áreas de texto<br>&nbsp;• <strong>Lectores de pantalla:</strong> HTML semántico con etiquetas y roles ARIA adecuados<br>&nbsp;• <strong>Gestión del foco:</strong> indicadores visibles y un orden de tabulación lógico<br><br>Estándares basados en las <a href=\"https://trailhead.salesforce.com/content/learn/modules/coding-for-web-accessibility/understand-accessible-navigation\" target=\"_blank\" rel=\"noopener\" class=\"accessibility-link\">directrices de accesibilidad de Salesforce</a>.",
  },

  // ── Japanese ───────────────────────────────────────────────────────────────
  ja: {
    about_tab_developer: "開発者",
    about_tab_privacy: "プライバシー",
    about_tab_disclaimer: "免責事項",
    privacy_title: "プライバシーについて",
    privacy_info:
      "My Cycle Keeperはデータを一切収集しません。データはこの端末内にのみ保存され、サーバー、アカウント、クラウドストレージは使用しません。アクセス解析、追跡、テレメトリー、広告、第三者コードはなく、データが外部へ送信されることもありません。保存データはPINを使ってAES-256-GCMで暗号化されます。健康データは利用者本人のものです。",
    about_title: "My Cycle Keeperについて",
    about_info:
      "My Cycle Keeperは、pythonime-labが開発したオープンソースの生理管理アプリ「Your Cycle Keeper」を、個人の好みに合わせて変更したフォークです。役に立った場合は、元の開発者への支援をご検討ください。どちらのプロジェクトも無料で、広告、追跡、データ収集はありません。予測は個人の参考情報であり、避妊には使用できません。",
    fork_title: "このフォークについて",
    fork_info:
      "この個人用フォークでは、直近6か月の移動平均による予測、My Calendar／dripからのアプリ内インポート、drip形式または一般CSVへのエクスポート、生理日の自動入力、生理の遅れに関する表示、テーマ、簡易的な周期履歴の共有などを追加しています。一部の元機能は削除されています。利用は自己責任でお願いします。",
    support_title: "開発者を支援",
    support_info:
      "このアプリは、pythonime-labが開発したYour Cycle Keeperのフォークです。役に立った場合は、元の開発者への支援をご検討ください。",
    disclaimer_title: "医療上の注意",
    disclaimer_info:
      "⚠️ このアプリは、一般的な生物学的傾向と記録済みデータに基づいて生理周期を推定します。医療上の助言ではなく、医療機関での診察に代わるものではありません。My Cycle Keeperは周期の傾向をもとに次回の生理や排卵時期を推定しますが、実際の時期はストレス、体調不良、服薬などさまざまな要因で変動します。避妊や妊娠可能性の保証には使用しないでください。医療上の判断については、資格を持つ医療従事者に相談してください。",
    accessibility_title: "アクセシビリティ",
    accessibility_info:
      "My Cycle KeeperはWCAG 2.0のアクセシビリティ基準に対応しています。Tab／Shift+Tab：操作可能な項目を前後に移動、矢印キー：カレンダー内の日付を移動、Enter／Space：ボタンやリンクを実行、Escape：ダイアログを閉じて元の項目にフォーカスを戻す、PIN入力：数字0〜9とBackspaceに対応、フォーム：入力欄・選択欄・テキストエリアをキーボードで操作可能、スクリーンリーダー：適切なARIAラベルとロールを設定、フォーカス管理：見やすいフォーカス表示と論理的な移動順序。",

    cycle_stats: "生理周期の統計",
    avg_length: "平均周期",
    avg_length_rolling: "直近6か月平均",
    avg_length_overall: "全期間平均",
    cycles_logged: "記録した周期",
    avg_period: "平均生理日数",
    fertile_days: "妊娠しやすい期間",
    symptom_tracking: "症状の記録",
    period: "生理",
    ovulation: "排卵",
    flow: "経血量",
    pain: "痛み",
    mood: "気分",
    how_it_works: "予測方法",
    how_it_works_p1:
      "My Cycle Keeperは、記録された周期の傾向から今後の生理開始日を予測します。予測には直近6か月の周期の移動平均を使用し、その平均と3日を超えて異なる周期には印が付きます。直近6か月の最短周期と最長周期の差が7日を超える場合は変動に関する通知が表示され、9日を超える場合はCleveland Clinicの案内に基づき、不規則な周期の可能性があることを示します。排卵日は次回の生理開始予定日の約14日前、妊娠しやすい期間は周期8日目から「周期日数－11」日目までとして推定されます。",
    how_it_works_p2:
      "28日周期が規則的に続く場合、通常は8〜17日目が妊娠しやすい期間で、排卵日は14日目ごろと推定されます。",
    disclaimer: "免責事項",
    estimation_disclaimer:
      "⚠️ 予測は目安です。避妊には使用できません。ストレス、体調不良、服薬などにより時期が変わることがあります。",
    no_symptoms_logged: "症状の記録はまだありません。",
    cycle_history: "周期履歴",
    all_months: "全期間",
    cycle_day: "サイクル日",
    until_next: "次回まで",
    day_1: "1日目",
    avg_length_short: "平均周期",
    period_short: "生理",
    fertile: "妊娠しやすい時期",
    ovulation_short: "排卵",
    luteal: "黄体期",

    storage_error_title: "保存領域エラー",
    storage_error_msg: "保存領域にアクセスできません。ページを再読み込みしてください。",
    db_error_title: "データベースエラー",
    db_error_msg: "アプリの保存領域を初期化できません。ページを再読み込みしてください。",

    unlock_subtitle: "PINを入力して健康データのロックを解除してください",
    too_many_attempts: "入力回数が上限を超えました。{secs}秒後にもう一度お試しください。",
    locked_out: "🚫 入力回数が上限を超えたため、60秒間ロックします。",
    lockout_ended: "ロックが解除されました。もう一度お試しください。",
    incorrect_pin_many: "PINが正しくありません。残り{remaining}回です。",
    decryption_failed: "データを復号できませんでした。データが破損している可能性があります。",
    error_try_again: "エラーが発生しました。もう一度お試しください。",

    forgot_pin_title: "PINを忘れましたか？",
    forgot_pin_msg:
      "すべての周期データを完全に削除し、My Cycle Keeperを初期状態に戻します。この操作は取り消せません。続けますか？",
    forgot_pin_confirm: "削除してリセット",
    reset_complete_title: "リセット完了",
    reset_complete_msg: "My Cycle Keeperをリセットしました。新しいPINを設定してください。",
    reset_failed_title: "リセット失敗",
    reset_failed_msg: "データを削除できませんでした。ページを再読み込みして再試行してください。",

    save_failed_title: "保存失敗",
    save_failed_msg: "データを保存できませんでした。もう一度お試しください。",
    missing_date_title: "日付が未入力です",
    missing_date_msg: "直近の生理開始日を入力してください。",
    set_pin_title: "PINを設定",
    set_pin_msg: "データを保護するため、4桁のPINを入力してください。",
    setup_error_title: "設定エラー",
    setup_error_msg: "設定を完了できませんでした。ページを再読み込みして再試行してください。",

    note_count: "{count} / 500",
    note_placeholder: "メモを入力…",

    set_flow: "経血量",
    save: "保存",
    cancel: "キャンセル",
    ok: "OK",
    refresh: "更新",
    pain_label: "痛み {value} / 10",
    set_pain: "痛み",
    mood_low: "落ち込み",
    mood_happy: "良い",
    mood_neutral: "普通",
    set_mood: "気分",

    period_expected_in_many: "次の生理は{n}日後と予測されています",

    phase_menstruation: "生理中",
    phase_follicular: "卵胞期",
    phase_fertile: "妊娠しやすい時期",
    phase_ovulation: "排卵日",
    phase_luteal: "黄体期",

    subtitle_menstruation: "生理{day}日目",
    subtitle_fertile: "{start}〜{end}日目は妊娠しやすい時期です",
    subtitle_ovulation: "今日は妊娠しやすさのピークです",
    subtitle_other: "次の生理まであと{n}日（予測）",

    status_cycle_day_of: "{total}日周期の{day}日目",
    status_period_today: "次の生理は今日始まると予測されています",
    status_period_soon_date: "次の生理は今日から{date}ごろまでに始まる可能性があります",
    status_period_in_date: "次の生理は{date}ごろに始まると予測されています",
    status_period_late_one: "生理が1日遅れています",
    status_period_late_many: "生理が{n}日遅れています",
    status_period_expected_on:
      "過去の記録では、{date}ごろに始まると予測されていました",
    status_phase_line: "フェーズ{num} — {phase}  ·  {detail}",
    now: "今日",
    bar_day: "{n}日目",

    cycle_history_empty: "周期履歴を表示するには、生理開始日を2回以上記録してください。",
    history_days_many: "{n}日",
    no_data_yet: "記録データはまだありません",

    chart_full_year: "{year}年（年間）",
    chart_month_year: "{year}年{month}月",

    download_failed_title: "ダウンロード失敗",
    download_failed_msg: "グラフをダウンロードできませんでした。もう一度お試しください。",

    invalid_date_title: "日付が正しくありません",
    invalid_date_msg: "正しい生理開始日を入力してください。",
    invalid_cycle_title: "周期日数が正しくありません",
    invalid_cycle_msg: "周期日数は20〜45日の範囲で入力してください。",
    invalid_duration_title: "生理日数が正しくありません",
    invalid_duration_msg: "生理日数は1〜10日の範囲で入力してください。",
    update_predictions_title: "予測を更新しますか？",
    update_predictions_msg:
      "新しい設定に基づいて、すべての周期予測を再計算します。記録済みの症状とメモは変更されません。続けますか？",
    update_predictions_confirm: "更新する",

    backup_never: "最終バックアップ：未実施",
    backup_today: "最後のバックアップ：今日",
    backup_yesterday: "最後のバックアップ：昨日",
    backup_days_ago_many: "最後のバックアップ：{n}日前",
    backup_overdue_many: "最終バックアップ：{n}日前 — バックアップをおすすめします",

    export_backup_title: "バックアップをエクスポート",
    export_backup_msg:
      "バックアップは暗号化されたファイルとして書き出されます。復号にはPINが必要です。安全な場所に保管してください。",
    export: "エクスポート",
    export_failed_title: "エクスポート失敗",
    export_failed_msg: "バックアップをエクスポートできませんでした。もう一度お試しください。",
    enter_backup_pin_title: "バックアップPINを入力",
    enter_backup_pin_msg: "このバックアップを作成した時点のPINを入力してください。",
    incorrect_pin_simple: "PINが違います。もう一度お試しください。",
    restored_title: "復元完了",
    restored_msg: "バックアップが正常に復元されました。",
    invalid_backup_title: "無効なバックアップ",
    invalid_backup_msg: "このバックアップ形式はサポートされていません。",
    import_failed_title: "インポート失敗",
    import_failed_msg: "バックアップファイルを読み込めませんでした。有効なバックアップファイルか確認してください。",

    storage_used: "{sizeKB} KB (IndexedDB)",
    storage_unknown: "不明",

    erase_title: "すべてのデータを削除",
    erase_msg:
      "すべての周期データを完全に削除します。この操作は取り消せません。続けますか？",
    erase_confirm: "すべて削除",
    erase_failed_title: "削除失敗",
    erase_failed_msg: "データを削除できませんでした。もう一度お試しください。",

    confirm_new_pin: "新しいPINを確認",
    enter_new_pin: "新しいPINを入力",
    reenter_pin_msg: "確認のため新しいPINをもう一度入力してください。",
    choose_pin_msg: "4桁のPINを設定してください。",
    pins_no_match: "PINが一致しません。もう一度お試しください。",
    pin_changed_title: "PIN変更完了",
    pin_changed_msg:
      "PINを更新し、すべてのデータを再暗号化しました。\n\n注意：変更前に作成したバックアップを復元する場合は、以前のPINが必要です。",
    pin_change_failed_title: "PIN変更失敗",
    pin_change_failed_msg: "PINを更新できませんでした。もう一度お試しください。",

    calendar_day_period: "生理日",
    calendar_day_ovulation: "排卵日",
    calendar_day_fertile: "妊娠可能日",
    calendar_day_regular: "通常の日",
    calendar_day_period_possible: "生理の可能性がある日",

    stat_std_dev: "標準偏差",
    stat_range: "周期の幅",
    stat_prediction_window: "予測範囲",
    stat_regularity: "周期の安定性",
    stat_regular: "安定",
    stat_variable: "変動あり",

    follicular: "卵胞期",
    menstrual: "月経期",
    other_cycle_days: "その他の周期日",
    history_daily_pattern: "日ごとの記録：経血量、痛み、気分",

    settings_autofill_label: "生理開始後の自動入力日数",
    settings_autofill_hint:
      "生理開始日の翌日から、指定した日数分を「少量」として自動入力します（例：5＝開始日を含めて合計6日）。空欄の場合は、直近6か月の平均生理日数から自動設定します。0にすると無効になります。",
    autofill_banner_msg_many: "{n}日分を「少量」として自動入力しました。",
    autofill_banner_settings: "設定を変更",
    autofill_banner_backup_pre: "",
    autofill_banner_backup: "バックアップ",

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
    theme_kawaii: "ピンクパワー",
    theme_custom: "カスタマイズ",

    custom_theme_hint:
      "直前に表示していた配色から始まります。変更はすぐにプレビューされます。プリセットを保存すれば、他のテーマを試したあとでも戻せます。",
    custom_theme_base_label: "ベースにするテーマ",
    custom_theme_base_hint:
      "変更すると、そのテーマの配色が出発点として読み込まれます。",
    custom_theme_preview_label: "カレンダーのプレビュー",
    custom_theme_preview_predicted: "予測日",
    custom_theme_preview_tolerance: "前後の日",
    custom_theme_bg: "ページの背景",
    custom_theme_card: "カードの背景",
    custom_theme_text: "文字",
    custom_theme_text_muted: "補助的な文字",
    custom_theme_accent: "アクセント",
    custom_theme_accent_light: "アクセント（明）",
    custom_theme_highlight: "ハイライト",
    custom_theme_fertile: "妊娠可能期間",
    custom_theme_ovulation: "排卵日",
    custom_theme_flow_start: "経血量グラデーション — 少ない",
    custom_theme_flow_end: "経血量グラデーション — 多い",
    custom_theme_picker_hue: "色相",
    custom_theme_picker_hint:
      "グラデーション上をドラッグして彩度と明るさを調整します。正確な色は16進数欄に入力できます。",
    custom_theme_picker_close: "カラーピッカーを閉じる",
    custom_theme_picker_value:
      "{hex}、彩度{saturation}%、明るさ{brightness}%",
    custom_theme_save: "プリセットを保存",
    custom_theme_load: "保存したプリセットを読み込む",
    custom_theme_reset: "テーマの配色に戻す",
    custom_theme_saved: "プリセットを保存しました。",
    custom_theme_loaded: "保存したプリセットを読み込みました。",
    custom_theme_none_saved: "保存されたプリセットはまだありません。",

    nav_calendar: "カレンダー",
    nav_insights: "分析",
    nav_settings: "設定",
    nav_about: "情報",

    settings_cycle_tab: "周期設定",
    settings_layout_tab: "レイアウト",
    settings_security_tab: "セキュリティとプライバシー",
    settings_calendar_display: "カレンダー",
    settings_cycle_section: "周期設定",
    settings_last_period: "直近の生理開始日",
    settings_cycle_length: "平均周期日数",
    settings_period_duration: "平均生理日数",
    settings_update_btn: "予測を更新",
    settings_tolerance: "予測範囲（日）",
    settings_tolerance_hint:
      "カレンダーで、生理開始予測日の前後に表示する日数です。空欄の場合は周期の安定性に基づいて自動設定します。",
    save: "保存",
    settings_show_fertility: "妊娠しやすい時期の推定を表示",
    settings_show_fertility_hint:
      "カレンダーに妊娠しやすい期間と排卵日の推定を表示し、統計にも妊娠しやすい日数を表示します。",
    settings_show_cycle_timeline: "周期フェーズを表示",
    settings_show_cycle_timeline_hint:
      "月経期、卵胞期、排卵期、黄体期を表示します。オフにすると、生理の進行状況のみを簡潔に表示します。",
    settings_security_section: "セキュリティとプライバシー",
    settings_change_pin: "PINを変更",
    settings_export: "暗号化バックアップをエクスポート",
    settings_import: "暗号化バックアップをインポート",
    settings_import_app: "他のアプリからインポート",
    settings_export_app: "他のアプリへエクスポート",

    app_export_title: "他のアプリへエクスポート",
    app_export_format_intro: "ダウンロードする形式を選択してください。",
    app_export_format_drip: "drip",
    app_export_format_plain: "一般CSV",
    app_export_hint_drip: "dripに再インポートできるdrip互換CSV。",
    app_export_hint_plain: "生理日、経血量、痛み、気分、メモを含む一般的なCSVファイルです。",
    app_export_empty_title: "エクスポートするデータがありません",
    app_export_empty_msg: "先に周期データを記録してから、もう一度お試しください。",
    app_export_downloaded_toast: "{filename} をダウンロードしました",
    app_export_failed_title: "エクスポート失敗",
    app_export_failed_msg: "ファイルをダウンロードできませんでした。もう一度お試しください。",

    drip_import_title: "dripからインポート",
    drip_import_found:
      "{days}日分のデータが見つかりました。このうち{periods}日には経血量の記録があります。インポート方法を選択してください。",
    drip_import_merge: "マージ（自分のデータを保持）",
    drip_import_replace: "置き換え（dripのデータを使用）",
    drip_import_done_title: "インポート完了",
    drip_import_done_msg: "{days}日分のデータが正常にインポートされました。",
    drip_import_failed_title: "インポート失敗",
    drip_import_failed_msg: "ファイルを読み込めませんでした。dripのCSVエクスポートであることを確認してください。",
    drip_import_empty_title: "インポートするデータがありません",
    drip_import_empty_msg: "ファイルに使用可能なデータが含まれていませんでした。",
    settings_storage_label: "使用ストレージ：",
    settings_storage_calculating: "計算中...",
    settings_erase: "すべてのデータを削除",
    settings_recalc_section: "周期履歴の再計算",
    settings_recalc_hint:
      "記録された経血量から周期履歴と予測を再構築します。履歴や予測が記録と合わない場合に使用してください。日々の記録は変更されません。",
    settings_recalc_btn: "周期履歴を再計算",
    settings_recalc_confirm_title: "周期履歴を再計算しますか？",
    settings_recalc_confirm_msg:
      "記録された経血量から周期履歴と予測を再構築します。日々の記録は変更されません。",
    settings_recalc_confirm_btn: "再計算",
    settings_recalc_done_toast: "周期履歴を再計算しました",
    drive_section_title: "Google Driveバックアップ",
    drive_section_desc:
      "Google Drive内の非表示のアプリデータフォルダに、暗号化されたバックアップを一方向で保存します。<strong>双方向同期ではありません</strong>。このアプリはDrive内のほかのファイルにはアクセスできず、暗号化されたデータを読み取るサーバーもありません。一方の端末で記録しても、別の端末には自動で反映されません。機種変更時やアプリデータを削除した後の復元に使用できます。",
    drive_test_user_note: "",
    drive_status_not_connected: "未接続",
    drive_status_last_backup: "最終バックアップ：{date} · 一方向バックアップ",
    drive_status_never_synced: "接続済み — まだバックアップがアップロードされていません",
    drive_connect_btn: "Google Driveに接続",
    drive_disconnect_btn: "切断",
    drive_disconnect_confirm_btn: "切断する",
    drive_disconnect_tap_again: "もう一度タップして切断を確定",
    drive_sync_now_btn: "今すぐバックアップ",
    drive_auto_label: "変更後に自動バックアップ（オンライン時）",
    drive_auto_hint:
      "変更を保存した後、一定時間操作がなければ暗号化バックアップをアップロードします。他の端末からのダウンロードやデータの統合は行いません。",
    drive_not_configured:
      "このビルドではGoogle Driveバックアップが未設定です（drive-config.jsにOAuthクライアントIDとトークンプロキシURLがありません。drive-oauth-proxy/README.mdを参照）。",
    drive_connected_toast: "Google Driveに接続しました",
    drive_disconnected_toast: "Google Driveから切断しました",
    drive_disconnect_failed: "切断できませんでした。もう一度お試しください。",
    drive_disconnecting: "切断中…",
    drive_sync_success_toast: "バックアップをアップロードしました",
    drive_sync_not_connected:
      "Google Driveに接続されていません。先に接続してください。",
    drive_sync_not_unlocked: "先にPINでアプリのロックを解除してください。",
    drive_sync_offline: "オフラインです。",
    drive_sync_failed_title: "Google Driveバックアップに失敗",
    drive_sync_failed_msg:
      "Google Driveバックアップを完了できませんでした。接続を確認して再試行してください。",
    drive_oauth_state_mismatch:
      "アプリがログイン状態を見失ったため、Googleサインインを完了できませんでした（ホーム画面ショートカットで起きやすいです）。アプリを完全に閉じてブラウザで開き直し、「接続」をもう一度試してください。",
    drive_oauth_redirect_mismatch:
      "Googleがサインインを拒否しました（リダイレクトURI不一致）。Google Cloud Console → 認証情報 → Webクライアントで、次のURIが正確に登録されているか確認してください:\n\nhttps://period.fishese.cc/\n\nクライアントの種類が「ウェブアプリケーション」（デスクトップではない）であることも確認してください。",
    drive_oauth_missing_secret:
      "Driveバックアップの設定が未完了です。クライアントシークレットを Worker（drive-oauth-proxy）に置き、drive-config.js の DRIVE_TOKEN_PROXY_URL を設定して再読み込みしてください。シークレットを公開アプリに入れないでください。",
    drive_oauth_invalid_grant:
      "Googleが認証コードを受け付けませんでした。期限切れか、すでに使用済みの可能性があります。「Google Driveに接続」を一度押し、ページを更新せずに完了してください。",
    drive_oauth_no_refresh:
      "Googleがオフラインアクセスを許可しませんでした。Googleアカウント → セキュリティ → サードパーティのアクセスで以前の許可を削除してから、再接続してください。",
    drive_oauth_access_denied:
      "Googleサインインがキャンセルまたは拒否されました。",
    drive_oauth_enter_pin:
      "Google Driveの接続を完了するにはPINを入力してください。",
    drive_oauth_code_expired:
      "Googleサインインがタイムアウトしました。「Google Driveに接続」をもう一度試してください。",
    drive_reconnect_msg:
      "Google Driveのアクセスが期限切れです。切断して再接続してください。",
    drive_disconnect_confirm_title: "Google Driveを切断しますか？",
    drive_disconnect_confirm_msg:
      "この端末からGoogleアカウントとの接続を解除します。暗号化されたバックアップファイルは、Google Drive上で削除するまで残ります。",
    drive_restore_found_title: "Google Driveから復元しますか？",
    drive_restore_found_msg:
      "Google Driveにバックアップが見つかりました。復元しますか？この端末の<strong>すべてのデータが置き換えられます</strong>。PINが必要です。",
    drive_restore_confirm: "バックアップを復元",
    drive_restore_skip: "ローカルデータを保持",
    drive_restore_not_found_title: "Google Driveのバックアップが見つかりません",
    drive_restore_not_found_msg:
      "Google Driveには接続できましたが、My Cycle Keeperのバックアップは見つかりませんでした。",

    onboard_sub: "生理周期を端末内で記録",
    onboard_tagline:
      "経血量、気分、症状を端末内に記録します。無料で、広告や追跡はなく、データは外部へ送信されません。",
    beta_label: "ベータ",
    beta_warning_text:
      "このアプリは開発中です。機能が変更される場合や、不具合が発生する場合があります。",
    ob_last_period: "直近の生理開始日",
    ob_cycle_len: "平均周期日数",
    ob_period_dur: "平均生理日数",
    pin_setup_title: "🔒 4桁のPINを設定",
    pin_setup_sub_1: "PINを使って、すべてのデータを端末内で暗号化します。",
    pin_setup_sub_2: "My Cycle Keeperはデータを外部に送信しません。",
    pin_setup_sub_3: "PINを忘れた場合、データを復元できず、リセット時に削除されます。",
    onboard_start_btn: "記録を開始",
    privacy_note_aes: "AES-256-GCM暗号化。",
    privacy_note_rest:
      "データは端末の外へ送信されません。アカウント不要、追跡なし、無料で利用できます。",
    timeout_before: "⏱️ 無操作状態が続くと",
    timeout_after: "秒後にセッションが終了します — タップして延長",

    flow_spotting: "微量の出血",
    flow_light: "少ない",
    flow_medium: "中程度",
    flow_heavy: "多い",
    flow_very_heavy: "非常に多い",
    log_add_entry: "記録を追加",
    log_edit_entry: "記録を編集",
    log_auto_save: "変更は自動的に保存されます",
    log_not_recorded: "未記録",
    log_clear: "クリア",
    log_none: "なし",
    log_no_pain: "痛みなし",
    log_note: "メモ",
    log_add_note: "メモを追加",
    log_delete_entry: "記録を削除",
    log_done: "完了",
    log_delete_title: "この記録を削除しますか？",
    log_delete_message: "この日の経血量、痛み、気分、メモを削除します。",
    log_entry_deleted: "記録を削除しました",
    log_saved: "保存済み ✓",
    log_saving: "保存中…",
    log_estimated_flow: "経血量は「少量」と推定されています。選択して確定してください。",
    print_options_title: "生理履歴を印刷",
    print_options_intro: "生理の日付と日数は必ず含まれます。その他の情報は任意です。",
    print_options_symptoms: "症状の詳細を含める",
    print_options_symptoms_hint: "経血量、痛み、気分のまとめ",
    print_options_notes: "メモを含める",
    print_options_notes_hint: "日ごとの個人的なメモ",
    continue: "続ける",

    settings_saved_toast: "設定が保存されました",
    status_no_data_hint:
      "生理を記録すると統計を確認できます。",
    status_import_hint: "またはデータをインポート",

    storage_full_title: "ストレージ容量不足",
    storage_full_msg:
      "端末の空き容量が不足しています。データをエクスポートするか、一部の記録を削除して空き容量を確保してください。",

    forgot_pin_confirm2_title: "最終確認",
    forgot_pin_confirm2_msg:
      "すべての生理記録データを完全に削除します。削除後は復元できず、この操作は取り消せません。",
    forgot_pin_confirm2_btn: "すべて削除",

    no_cycle_history: "周期履歴はまだありません。生理開始日を2回以上記録してください。",
    history_showing: "全{total}周期のうち、直近{shown}周期を表示",
    predictions_tab: "今後の生理予測",
    predictions_empty: "予測を表示するには、生理開始日を1回以上記録してください。",
    history_col_start: "開始",
    history_col_end: "終了",
    history_col_dates: "日付",
    history_col_period: "生理",
    history_col_cycle: "周期",
    view_all_history: "すべて表示",
    share_history: "共有",
    share_history_subject: "最近の生理日",
    share_history_intro: "直近6回の生理（開始日〜終了日）：",
    share_history_empty: "共有できる生理履歴がまだありません。",
    print_summary: "概要を印刷",
    print_summary_title: "My Cycle Keeper — 周期の概要",
    print_summary_generated: "作成日：{date}",
    print_summary_stats_title: "概要",
    print_summary_next_period: "次回の生理予測",
    print_summary_col_symptoms: "メモ",
    print_summary_avg_pain: "平均の痛み：{value}/10",
    print_summary_avg_mood: "平均の気分：{value}/100",
    print_summary_notes_count_many: "メモ{n}件",
    print_summary_disclaimer:
      "自己申告データから作成した個人向けの参考情報です。医療上の助言ではありません。医療上の判断については、資格を持つ医療従事者に相談してください。",

    legend_short: "短い（26日未満）",
    legend_normal: "標準（26〜32日）",
    legend_long: "長い（32日超）",

    // Complete Japanese translations for keys previously falling back to English
    incorrect_pin_one: "PINが正しくありません。残り{remaining}回です。",
    period_expected_in_one: "次の生理は{n}日後と予測されています",
    history_days_one: "{n}日",
    backup_days_ago_one: "最終バックアップ：{n}日前",
    backup_overdue_one: "最終バックアップ：{n}日前 — バックアップをおすすめします",
    stat_rolling_title: "直近6か月",
    stat_rolling_hint: "予測に使用",
    stat_overall_title: "全期間",
    stat_cycles_count: "周期数",
    cycle_shift_longer: "前回の周期は、直近6か月の平均より{days}日長くなっています",
    cycle_shift_shorter: "前回の周期は、直近6か月の平均より{days}日短くなっています",
    cycle_shift_tooltip: "直近6か月の平均との差：{days}日",
    cycle_spread_caution: "直近6か月の周期は{min}〜{max}日で、差は{spread}日です。多少の変動は一般的です。",
    cycle_spread_irregular: "直近6か月の周期は{min}〜{max}日で、差は{spread}日です。周期ごとの差が9日を超える場合、不規則な可能性があります。",
    cycle_spread_caution_short: "周期に変動あり：差{spread}日（直近6か月）",
    cycle_spread_irregular_short: "不規則な傾向：差{spread}日（直近6か月）",
    history_current: "進行中",
    legend_shifted: "変動（6か月平均との差が3日超）",
    settings_autofill_auto: "自動",
    autofill_banner_msg_one: "{n}日分を「少量」として自動入力しました。",
    ob_setup_title: "周期を設定",
    ob_setup_hint: "直近の生理開始日を入力すると、すぐに予測を表示できます。既存データのインポートや、日付を入力せずに記録を始めることもできます。",
    ob_continue_btn: "続ける →",
    onboard_restore_backup: "暗号化バックアップを復元",
    onboard_restore_drive: "Google Driveから復元",
    ob_back_btn: "← 戻る",
    app_import_title: "他のアプリからインポート",
    app_import_source_intro: "データを書き出したアプリを選択してください。",
    app_import_source_mycalendar: "My Calendar",
    app_import_source_drip: "drip",
    app_import_file_hint_mycalendar:
      "My Calendarで「設定 → 医師向けドキュメントをエクスポート」を選び、作成された.txtファイルをここで読み込んでください。",
    app_import_file_hint_drip:
      "dripで右上の3点メニューから「設定 → データ」を開き、エクスポートした.csvファイルをここで読み込んでください。",
    app_import_choose_file: "ファイルを選択",
    app_import_back: "戻る",
    app_import_review_counts: "生理{periods}件のうち、{withFlow}件には元データの経血量があります。",
    app_import_review_warning: "{count}件の生理に経血量がありません。パターンを設定して補うか、元データのまま続けてください。",
    app_import_pattern_label: "経血量パターン（1〜4、0＝少量出血）",
    app_import_pattern_hint: "パターンが生理日数より長い場合、余分な日数は無視されます。短い場合は、最後の値を残りの日数にも使用します。",
    app_import_flow_mode_legend: "元データに経血量がある場合",
    app_import_flow_overwrite: "既存の経血量を上書き",
    app_import_flow_fill_gaps: "経血量がない生理だけ補完",
    app_import_continue: "続ける",
    app_import_report_unmapped: "変換できなかった気分",
    app_import_report_leftovers: "未対応のデータ",
    app_import_copy: "レポートをコピー",
    app_import_export_txt: ".txtで書き出す",
    app_import_export_csv: ".csvで書き出す",
    app_import_done: "完了",
    app_import_failed_title: "インポート失敗",
    app_import_empty_title: "インポートするデータがありません",
    app_import_empty_msg: "ファイルに使用できるデータが含まれていません。",
    app_import_done_msg: "{days}日分のデータをインポートしました。",
    app_import_merge_title: "データをインポート",
    app_import_merge_msg: "{days}日分のデータが見つかりました。適用方法を選択してください。",
    app_import_merge: "統合（現在のデータを保持）",
    app_import_replace: "置き換え（インポートしたデータを使用）",
    app_import_report_summary_source: "取得元：{source}",
    app_import_report_summary_periods: "生理：{count}件",
    app_import_report_summary_flow_days: "経血量のある日：{count}日",
    app_import_report_summary_mood_days: "気分のある日：{count}日",
    app_import_report_summary_leftover_days: "未対応データのある日：{count}日",
    app_import_report_summary_unmapped: "変換できなかった気分：{count}件",
    app_import_report_summary_imported: "インポートした日数：{count}日",
    app_import_report_result: "{periods}周期、計{days}日分の生理データをインポートしました。",
    app_import_report_extras_note: "このアプリでまだ記録できない項目があります。以下に一覧を表示します。必要に応じてコピーまたは書き出し、後からメモとして保存してください。",
    app_import_copy_success: "レポートをクリップボードにコピーしました",
    app_import_copy_failed: "レポートをコピーできませんでした",
    drip_import_panel_intro: "drip互換CSVファイルから周期履歴をインポートします。dripで「メニュー → データをエクスポート → CSVとしてエクスポート」を選択してください。",
    drip_import_panel_before: "My Calendarとdripのデータは、どちらも「設定 → 他のアプリからインポート」から直接取り込めます。",
    drip_import_choose_csv: "CSVファイルを選択",
    drip_import_mycalendar_label: "dripではなくMy Calendarを使用していますか？",
    drip_import_mycalendar_link: "設定の「他のアプリからインポート」へ →",
    print_summary_notes_count_one: "メモ{n}件",

    flow_question: "今日の経血量は？",
    log_force_new_cycle: "新しい生理として記録する",
    log_force_new_cycle_hint:
      "経血量を設定した場合にのみ適用されます。直近の生理と同じ期間としてまとめられる記録を、別の生理として分けるときに使用します。",
    security_info:
      "すべてのデータは、保存前にPINを使って暗号化されます。Cycle Keeperは、ブラウザのHTTPSでも使われる標準技術である<strong>Web Crypto API</strong>を使用しています。<br><br>データはサーバーへ送信されません。アカウントもアクセス解析もありません。",
    data_persistence:
      "⚠️ <strong>データの保存について：</strong>データはIndexedDBに保存されます。ブラウザのキャッシュを削除してもデータは残りますが、ブラウザ設定から「サイトデータ」または「Cookieとサイトデータ」を削除すると、すべての周期データが消去されます。事前にバックアップをエクスポートしてください。",
    about_info_html:
      "<strong>My Cycle Keeper</strong>は、<a href=\"https://github.com/pythonime-lab/yourcyclekeeper\" target=\"_blank\" rel=\"noopener\" class=\"accessibility-link\">Your Cycle Keeper</a>（<a href=\"https://github.com/pythonime-lab\" target=\"_blank\" rel=\"noopener\" class=\"accessibility-link\">pythonime-lab</a>が開発したオープンソースの生理管理アプリ）を、個人の好みに合わせて変更したフォークです。<br><br>役に立った場合は、元の開発者を<a href=\"https://github.com/pythonime-lab\" target=\"_blank\" rel=\"noopener\" class=\"accessibility-link\">GitHub</a>で支援することをご検討ください。<br><br>Your Cycle Keeperとこのフォークはどちらも無料で、広告、追跡、データ収集はありません。予測は個人の参考情報であり、避妊には使用できません。ストレス、体調不良、服薬などにより時期が変わることがあります。<br><br><strong>バージョン：</strong>1.0.0-beta<br><strong>ライセンス：</strong>GNU General Public License v3.0",
    fork_title: "このフォークについて",
    fork_info_html:
      "この個人用フォークでは、直近6か月の移動平均による周期予測、My Calendar／dripからのアプリ内インポート、drip形式または一般CSVへのエクスポート、生理日の自動入力、生理の遅れに関する表示、テーマ／レイアウト、簡易的な周期履歴のメール共有などを追加しています。<br><br>一部の元機能は削除しています。予測方法とCSV形式は、bloodyhealthの<a href=\"https://gitlab.com/bloodyhealth/drip\" target=\"_blank\" rel=\"noopener\" class=\"accessibility-link\">drip</a>を参考にしています。AI支援で作成されています。<strong>利用は自己責任でお願いします。</strong><br><br><small style=\"color: var(--text-muted)\"><a href=\"https://fishese.github.io/tools/\" target=\"_blank\" rel=\"noopener\" class=\"accessibility-link\">0oo.fish.oo0</a></small>",
    support_info:
      "このアプリは、pythonime-labが開発したYour Cycle Keeperのフォークです。役に立った場合は、元の開発者への支援をご検討ください。",
    support_via: "支援する",
    support_footer:
      "支援は、元のYour Cycle Keeperプロジェクトの維持と広告なしでの提供に役立ちます。",
    privacy_info_html:
      "My Cycle Keeperは<strong>データを一切収集しません</strong>。<br>&nbsp;• データはこの端末内にのみ保存<br>&nbsp;• サーバー、アカウント、クラウドストレージを使用しない<br>&nbsp;• アクセス解析、追跡、テレメトリーを使用しない<br>&nbsp;• 広告、第三者コードを使用しない<br>&nbsp;• データを外部へ送信しない<br>&nbsp;• PINを使ってAES-256-GCMで暗号化<br><br>健康データは利用者本人のものです。",
    disclaimer_info_html:
      "⚠️ <strong>このアプリは、一般的な生物学的傾向と記録済みデータに基づいて生理周期を推定します。</strong>医療上の助言ではなく、<em>医療機関での診察に代わるものではありません。</em><br><br>My Cycle Keeperは周期の傾向をもとに次回の生理や排卵時期を推定しますが、実際の時期はストレス、体調不良、服薬などさまざまな要因で変動します。<br><br>避妊や妊娠可能性の<strong>保証</strong>には使用しないでください。医療上の判断については、資格を持つ医療従事者に相談してください。",
    accessibility_info_html:
      "My Cycle Keeperは<strong>WCAG 2.0のアクセシビリティ基準</strong>に対応しています。<br><br>&nbsp;• <strong>Tab／Shift+Tab：</strong>操作可能な項目を前後に移動<br>&nbsp;• <strong>矢印キー：</strong>カレンダー内の日付を移動<br>&nbsp;• <strong>Enter／Space：</strong>ボタンやリンクを実行<br>&nbsp;• <strong>Escape：</strong>ダイアログを閉じ、元の項目にフォーカスを戻す<br>&nbsp;• <strong>PIN入力：</strong>数字0〜9とBackspaceに対応<br>&nbsp;• <strong>フォーム：</strong>入力欄、選択欄、テキストエリアをキーボードで操作可能<br>&nbsp;• <strong>スクリーンリーダー：</strong>適切なARIAラベルとロールを設定<br>&nbsp;• <strong>フォーカス管理：</strong>見やすいフォーカス表示と論理的な移動順序",
  },

  // ── Traditional Chinese ────────────────────────────────────────────────────
  "zh-TW": {
    about_tab_developer: "開發者",
    about_tab_privacy: "隱私",
    about_tab_disclaimer: "免責聲明",
    privacy_title: "隱私保護",
    privacy_info:
      "My Cycle Keeper 完全不收集資料。所有資料只會儲存在此裝置，不使用伺服器、帳戶或雲端儲存，也沒有數據分析、追蹤、遙測、廣告或第三方程式碼。資料不會傳送到裝置以外，並以 PIN 碼透過 AES-256-GCM 加密。健康資料只屬於使用者本人。",
    about_title: "關於 My Cycle Keeper",
    about_info:
      "My Cycle Keeper 是 Your Cycle Keeper 的個人分支版本。Your Cycle Keeper 是由 pythonime-lab 開發的開源月經追蹤應用程式；此版本則依個人偏好作出調整。若覺得實用，可考慮支持原始開發者。兩個專案均免費使用，沒有廣告、追蹤或資料收集。所有估算僅供個人參考，不可作為避孕依據。",
    fork_title: "關於此分支",
    fork_info:
      "此個人分支新增近 6 個月滾動平均預測、從 My Calendar／drip 匯入資料、匯出為 drip 格式或一般 CSV、自動填入經期、月經延遲提示、主題，以及精簡的週期紀錄分享。部分原始功能已移除。請自行評估使用風險。",
    support_title: "支持開發者",
    support_info:
      "此應用程式是 pythonime-lab 開發的 <strong>Your Cycle Keeper</strong> 的分支版本。若覺得實用，可考慮支持原始開發者。",
    disclaimer_title: "醫療注意事項",
    disclaimer_info:
      "⚠️ 本應用程式會根據一般生物規律及已記錄資料估算月經週期。相關內容不是醫療建議，也不能取代專業醫療諮詢。My Cycle Keeper 會根據週期模式預測下次月經及排卵時間，但實際時間可能受壓力、疾病、藥物及其他因素影響。請勿將本應用程式作為避孕方法或受孕保證。涉及醫療決定時，請諮詢合資格的醫療專業人員。",
    accessibility_title: "無障礙功能",
    accessibility_info:
      "My Cycle Keeper 依循 WCAG 2.0 無障礙標準。Tab／Shift+Tab：在互動項目之間前後移動；方向鍵：在日曆日期之間移動；Enter／Space：啟用按鈕及連結；Escape：關閉對話框並將焦點移回原項目；PIN 碼輸入：支援數字 0–9 及 Backspace；表單控制項：支援以鍵盤操作輸入欄、選單及文字區域；螢幕閱讀器：使用語意化 HTML、適當的 ARIA 標籤及角色；焦點管理：提供清晰的焦點標示及合理的操作順序。",

    cycle_stats: "月經週期統計",
    avg_length: "平均週期長度",
    avg_length_rolling: "近 6 個月平均",
    avg_length_overall: "所有紀錄平均",
    cycles_logged: "已記錄週期數",
    avg_period: "平均經期天數",
    fertile_days: "易受孕期",
    symptom_tracking: "症狀記錄",
    period: "月經",
    ovulation: "排卵",
    flow: "經血量",
    pain: "疼痛",
    mood: "情緒",
    how_it_works: "預測方式",
    how_it_works_p1:
      "My Cycle Keeper 會根據已記錄的月經週期規律，估算接下來的月經開始日期。預測採用最近 6 個月週期的滾動平均值；與此平均值相差超過 3 天的週期會加上標記。若這段期間內最短與最長週期相差超過 7 天，系統會顯示週期變動提示；若相差超過 9 天，依 Cleveland Clinic 的指引，可能屬於週期不規律。排卵日估計為下次月經開始前約 14 天；易受孕期則估計為週期第 8 天至「週期長度 − 11」天。",
    how_it_works_p2:
      "以規律的 28 天週期為例，第 8 至 17 天通常屬於易受孕期，排卵日約在第 14 天。",
    disclaimer: "注意事項",
    estimation_disclaimer:
      "⚠️ 本工具只提供估算，不可作為避孕依據。壓力、疾病及藥物都可能影響週期時間。",
    no_symptoms_logged: "尚未記錄症狀。",
    cycle_history: "週期紀錄",
    all_months: "所有月份",
    cycle_day: "週期日",
    until_next: "距下次月經",
    day_1: "第1天",
    avg_length_short: "平均週期",
    period_short: "經期",
    fertile: "易受孕期",
    ovulation_short: "排卵",
    luteal: "黃體期",

    storage_error_title: "儲存空間錯誤",
    storage_error_msg: "無法存取儲存空間，請重新載入頁面。",
    db_error_title: "資料庫錯誤",
    db_error_msg: "無法初始化應用程式的儲存空間，請重新載入頁面。",

    unlock_subtitle: "請輸入 PIN 碼以解鎖健康資料",
    too_many_attempts: "嘗試次數過多，請在 {secs} 秒後再試。",
    locked_out: "🚫 嘗試次數過多，已鎖定 60 秒。",
    lockout_ended: "鎖定已解除，請再試一次。",
    incorrect_pin_many: "PIN 碼不正確，還可嘗試 {remaining} 次。",
    decryption_failed: "無法解密資料，資料可能已損毀。",
    error_try_again: "發生錯誤。請再試一次。",

    forgot_pin_title: "忘記 PIN 碼？",
    forgot_pin_msg:
      "此操作會永久刪除所有月經週期資料，並將 My Cycle Keeper 重設為初始狀態。操作無法復原，確定要繼續嗎？",
    forgot_pin_confirm: "刪除資料並重設",
    reset_complete_title: "重置完成",
    reset_complete_msg: "My Cycle Keeper 已重設，請設定新的 PIN 碼。",
    reset_failed_title: "重置失敗",
    reset_failed_msg: "無法清除資料，請重新載入頁面後再試。",

    save_failed_title: "儲存失敗",
    save_failed_msg: "無法儲存您的資料。請再試一次。",
    missing_date_title: "尚未輸入日期",
    missing_date_msg: "請輸入最近一次月經的第一天。",
    set_pin_title: "設定 PIN 碼",
    set_pin_msg: "請設定 4 位數 PIN 碼以保護資料。",
    setup_error_title: "設定錯誤",
    setup_error_msg: "無法完成設定。請重新整理頁面並再試一次。",

    note_count: "{count} / 500",
    note_placeholder: "新增備註…",

    set_flow: "經血量",
    save: "儲存",
    cancel: "取消",
    ok: "確定",
    refresh: "重新整理",
    pain_label: "疼痛程度 {value} / 10",
    set_pain: "疼痛程度",
    mood_low: "心情低落",
    mood_happy: "良好",
    mood_neutral: "一般",
    set_mood: "情緒",

    period_expected_in_many: "距離預計月經開始還有 {n} 天",

    phase_menstruation: "經期",
    phase_follicular: "濾泡期",
    phase_fertile: "易受孕期",
    phase_ovulation: "排卵日",
    phase_luteal: "黃體期",

    subtitle_menstruation: "經期第 {day} 天",
    subtitle_fertile: "週期第 {start} 至 {end} 天為易受孕期",
    subtitle_ovulation: "今天是易受孕期的高峰",
    subtitle_other: "距下次預計月經還有 {n} 天",

    status_cycle_day_of: "{total} 天週期的第 {day} 天",
    status_period_today: "預計今天開始月經",
    status_period_soon_date: "月經可能在今天或 {date} 前後開始",
    status_period_in_date: "下次月經預計在 {date} 前後開始",
    status_period_late_one: "月經已延遲 1 天",
    status_period_late_many: "月經已延遲 {n} 天",
    status_period_expected_on:
      "根據過往紀錄，月經原預計於 {date} 開始",
    status_phase_line: "階段 {num} — {phase}  ·  {detail}",
    now: "現在",
    bar_day: "第{n}天",

    cycle_history_empty: "請至少記錄兩次月經開始日期，以查看週期紀錄。",
    history_days_many: "{n} 天",
    no_data_yet: "尚未記錄資料",

    chart_full_year: "{year} 年全年",
    chart_month_year: "{year} 年 {month} 月",

    download_failed_title: "下載失敗",
    download_failed_msg: "無法下載圖表，請再試一次。",

    invalid_date_title: "日期不正確",
    invalid_date_msg: "請輸入有效的月經開始日期。",
    invalid_cycle_title: "週期長度不正確",
    invalid_cycle_msg: "週期長度須介乎 20 至 45 天。",
    invalid_duration_title: "經期天數不正確",
    invalid_duration_msg: "經期天數須介乎 1 至 10 天。",
    update_predictions_title: "更新預測？",
    update_predictions_msg:
      "系統會根據新設定重新計算所有週期預測。已記錄的症狀及備註不會更改。確定要繼續嗎？",
    update_predictions_confirm: "更新",

    backup_never: "上次備份：尚未備份",
    backup_today: "上次備份：今天",
    backup_yesterday: "上次備份：昨天",
    backup_days_ago_many: "上次備份：{n} 天前",
    backup_overdue_many: "上次備份：{n} 天前 — 建議立即備份",

    export_backup_title: "匯出備份",
    export_backup_msg:
      "備份會匯出為加密檔案，只有使用 PIN 碼才能解密。請妥善保管。",
    export: "匯出",
    export_failed_title: "匯出失敗",
    export_failed_msg: "無法匯出備份。請再試一次。",
    enter_backup_pin_title: "輸入備份的 PIN 碼",
    enter_backup_pin_msg: "請輸入建立此備份時所使用的 PIN 碼。",
    incorrect_pin_simple: "PIN 碼不正確，請再試一次。",
    restored_title: "已還原",
    restored_msg: "您的備份已成功還原。",
    invalid_backup_title: "備份檔案無效",
    invalid_backup_msg: "此備份格式不受支援。",
    import_failed_title: "匯入失敗",
    import_failed_msg: "無法讀取備份檔案，請確認檔案格式正確。",

    storage_used: "{sizeKB} KB (IndexedDB)",
    storage_unknown: "未知",

    erase_title: "刪除所有資料",
    erase_msg:
      "此操作會永久刪除所有月經週期資料，而且無法復原。確定要繼續嗎？",
    erase_confirm: "刪除所有資料",
    erase_failed_title: "刪除失敗",
    erase_failed_msg: "無法刪除資料。請再試一次。",

    confirm_new_pin: "確認新的 PIN 碼",
    enter_new_pin: "輸入新的 PIN 碼",
    reenter_pin_msg: "請再次輸入新的 PIN 碼以確認。",
    choose_pin_msg: "請設定 4 位數 PIN 碼。",
    pins_no_match: "兩次輸入的 PIN 碼不一致，請再試一次。",
    pin_changed_title: "PIN 碼已更改",
    pin_changed_msg:
      "PIN 碼已更新，所有資料亦已重新加密。\n\n注意：還原更改前建立的備份時，仍需使用舊 PIN 碼。",
    pin_change_failed_title: "無法更改 PIN 碼",
    pin_change_failed_msg: "無法更新 PIN 碼，請再試一次。",

    calendar_day_period: "經期日",
    calendar_day_ovulation: "排卵日",
    calendar_day_fertile: "易受孕日",
    calendar_day_regular: "一般日期",
    calendar_day_period_possible: "可能來月經的日期",

    stat_std_dev: "標準差",
    stat_range: "週期差距",
    stat_prediction_window: "預測範圍",
    stat_regularity: "週期規律性",
    stat_regular: "規律",
    stat_variable: "有變動",

    follicular: "濾泡期",
    menstrual: "月經期",
    other_cycle_days: "其他週期日",
    history_daily_pattern: "每日紀錄：經血量、疼痛及情緒",

    settings_autofill_label: "自動填入月經開始後的天數",
    settings_autofill_hint:
      "從月經開始日的翌日起，自動以「少量」經血填入指定天數（例如設為 5，即連同開始日共 6 天）。留空時，系統會按最近 6 個月的平均經期天數自動設定；設為 0 則停用。",
    autofill_banner_msg_many: "已自動填入 {n} 天的「少量」經血紀錄。",
    autofill_banner_settings: "調整設定",
    autofill_banner_backup_pre: "",
    autofill_banner_backup: "備份資料",

    language_label: "語言",
    lang_en: "English",
    lang_ru: "Русский",
    lang_es: "Español",
    lang_ja: "日本語",
    lang_zh_tw: "繁體中文",

    settings_theme_label: "顯示主題",
    theme_default: "YCK 經典",
    theme_light: "Newsroom 淺色",
    theme_dark: "Newsroom 深色",
    theme_kawaii: "Pink Power",
    theme_custom: "自訂",

    custom_theme_hint:
      "以你剛才看到的配色為起點，修改後會立即預覽。儲存為預設組合，之後切換其他主題也能隨時取回。",
    custom_theme_base_label: "以哪個主題為基礎",
    custom_theme_base_hint: "變更後會載入該主題的配色作為起點。",
    custom_theme_preview_label: "日曆預覽",
    custom_theme_preview_predicted: "預測日",
    custom_theme_preview_tolerance: "前後彈性日",
    custom_theme_bg: "頁面背景",
    custom_theme_card: "卡片背景",
    custom_theme_text: "文字",
    custom_theme_text_muted: "次要文字",
    custom_theme_accent: "主色",
    custom_theme_accent_light: "主色（淺）",
    custom_theme_highlight: "強調色",
    custom_theme_fertile: "易孕期",
    custom_theme_ovulation: "排卵日",
    custom_theme_flow_start: "血量漸層 — 少量",
    custom_theme_flow_end: "血量漸層 — 大量",
    custom_theme_picker_hue: "色相",
    custom_theme_picker_hint:
      "在漸層中拖曳以調整飽和度與亮度；如需精確顏色，可直接輸入十六進位色碼。",
    custom_theme_picker_close: "關閉顏色選擇器",
    custom_theme_picker_value:
      "{hex}；飽和度 {saturation}%；亮度 {brightness}%",
    custom_theme_save: "儲存預設組合",
    custom_theme_load: "載入已儲存的組合",
    custom_theme_reset: "還原為主題配色",
    custom_theme_saved: "已儲存預設組合。",
    custom_theme_loaded: "已載入儲存的組合。",
    custom_theme_none_saved: "尚未儲存任何組合。",

    nav_calendar: "日曆",
    nav_insights: "分析",
    nav_settings: "設定",
    nav_about: "關於",

    settings_cycle_tab: "週期",
    settings_layout_tab: "介面",
    settings_security_tab: "安全與隱私",
    settings_calendar_display: "日曆顯示",
    settings_cycle_section: "月經週期設定",
    settings_last_period: "最近一次月經開始日期",
    settings_cycle_length: "平均週期長度（天）",
    settings_period_duration: "平均經期天數",
    settings_update_btn: "更新預測",
    settings_tolerance: "預測範圍（天）",
    settings_tolerance_hint:
      "設定日曆在預計月經開始日前後顯示的天數。留空時，系統會按週期規律性自動設定。",
    save: "儲存",
    settings_show_fertility: "顯示易受孕期估算",
    settings_show_fertility_hint:
      "在日曆顯示估算的易受孕日及排卵日，並在統計中顯示易受孕天數。",
    settings_show_cycle_timeline: "顯示週期階段",
    settings_show_cycle_timeline_hint:
      "顯示月經期、濾泡期、排卵期及黃體期。關閉後只顯示簡化的經期進度。",
    settings_security_section: "安全與隱私",
    settings_change_pin: "更改 PIN 碼",
    settings_export: "匯出加密備份",
    settings_import: "匯入加密備份",
    settings_import_app: "從其他應用程式匯入",
    settings_export_app: "匯出至其他應用程式",

    app_export_title: "匯出至其他應用程式",
    app_export_format_intro: "請選擇下載格式。",
    app_export_format_drip: "drip",
    app_export_format_plain: "一般 CSV",
    app_export_hint_drip: "可重新匯入 drip 的 drip 相容 CSV。",
    app_export_hint_plain: "包含月經日期、經血量、疼痛、情緒及備註的一般 CSV 檔案。",
    app_export_empty_title: "無可匯出的資料",
    app_export_empty_msg: "請先記錄月經週期資料，再進行匯出。",
    app_export_downloaded_toast: "已下載 {filename}",
    app_export_failed_title: "匯出失敗",
    app_export_failed_msg: "無法下載檔案。請再試一次。",

    drip_import_title: "從 drip 匯入",
    drip_import_found:
      "找到 {days} 天的資料，其中 {periods} 天有經血量紀錄。請選擇匯入方式。",
    drip_import_merge: "合併（保留我的資料）",
    drip_import_replace: "取代（使用 drip 資料）",
    drip_import_done_title: "匯入完成",
    drip_import_done_msg: "已成功匯入{days}天的資料。",
    drip_import_failed_title: "匯入失敗",
    drip_import_failed_msg: "無法讀取檔案，請確認這是從 drip 匯出的 CSV 檔案。",
    drip_import_empty_title: "無可匯入的內容",
    drip_import_empty_msg: "該檔案不包含可用資料。",
    settings_storage_label: "已使用儲存空間：",
    settings_storage_calculating: "計算中...",
    settings_erase: "刪除所有資料",
    settings_recalc_section: "週期紀錄維護",
    settings_recalc_hint:
      "根據已記錄的經血量重建週期紀錄及預測。若紀錄或預測與實際資料不一致，可使用此功能；每日紀錄不會被更改。",
    settings_recalc_btn: "重新計算週期紀錄",
    settings_recalc_confirm_title: "重新計算週期紀錄？",
    settings_recalc_confirm_msg:
      "系統會根據已記錄的經血量重建週期紀錄及預測。每日紀錄不會被更改。",
    settings_recalc_confirm_btn: "重新計算",
    settings_recalc_done_toast: "週期紀錄已重新計算",
    drive_section_title: "Google Drive 備份",
    drive_section_desc:
      "將加密備份單向儲存至 Google Drive 中隱藏的應用程式資料夾；這<strong>不是</strong>雙向同步。本應用程式無法存取你在 Drive 中的其他檔案，也沒有任何可讀取加密資料的伺服器。在一台裝置上新增的紀錄不會自動同步至其他裝置；此功能可用於更換手機或清除應用程式資料後還原紀錄。",
    drive_test_user_note: "",
    drive_status_not_connected: "未連線",
    drive_status_last_backup: "上次備份：{date} · 單向備份",
    drive_status_never_synced: "已連線 — 尚未上傳任何備份",
    drive_connect_btn: "連線 Google Drive",
    drive_disconnect_btn: "中斷連線",
    drive_disconnect_confirm_btn: "確認中斷連線",
    drive_disconnect_tap_again: "再按一次以確認中斷連線",
    drive_sync_now_btn: "立即備份",
    drive_auto_label: "變更後自動備份（連線時）",
    drive_auto_hint:
      "儲存變更後，系統會在短暫延遲後上傳加密備份。不會從其他裝置下載或合併資料。",
    drive_not_configured:
      "此版本未設定 Google Drive 備份（drive-config.js 缺少 OAuth 用戶端 ID 與 token proxy URL；見 drive-oauth-proxy/README.md）。",
    drive_connected_toast: "已連線 Google Drive",
    drive_disconnected_toast: "已中斷 Google Drive",
    drive_disconnect_failed: "無法中斷連線，請再試一次。",
    drive_disconnecting: "中斷中…",
    drive_sync_success_toast: "已上傳備份",
    drive_sync_not_connected: "尚未連線 Google Drive，請先連線。",
    drive_sync_not_unlocked: "請先使用 PIN 碼解鎖應用程式。",
    drive_sync_offline: "目前離線。",
    drive_sync_failed_title: "Google Drive 備份失敗",
    drive_sync_failed_msg:
      "無法完成 Google Drive 備份。請檢查連線後再試。",
    drive_oauth_state_mismatch:
      "應用程式遺失登入狀態，無法完成 Google 登入（從主畫面捷徑開啟時較常見）。請完全關閉應用程式，改用瀏覽器開啟，然後再試一次連線。",
    drive_oauth_redirect_mismatch:
      "Google 拒絕登入（重新導向 URI 不符）。請在 Google Cloud Console → 憑證 → Web 用戶端確認已登錄此精確 URI：\n\nhttps://period.fishese.cc/\n\n並確認類型為「網頁應用程式」（非桌面應用程式）。",
    drive_oauth_missing_secret:
      "Drive 備份尚未完成設定：請部署 token proxy（drive-oauth-proxy）並放入 Client secret，在 drive-config.js 設定 DRIVE_TOKEN_PROXY_URL 後重新整理。請勿將 Client secret 放進公開應用程式。",
    drive_oauth_invalid_grant:
      "Google 不接受授權碼——可能已過期或已使用。請再按一次「連線 Google Drive」，完成流程時不要重新整理頁面。",
    drive_oauth_no_refresh:
      "Google 未授予離線存取權。請在 Google 帳戶 → 安全性 → 第三方存取權限撤銷先前授權後再連線。",
    drive_oauth_access_denied:
      "已取消或拒絕 Google 登入。",
    drive_oauth_enter_pin:
      "請輸入 PIN 以完成 Google Drive 連線。",
    drive_oauth_code_expired:
      "Google 登入逾時。請再按「連線 Google Drive」重試。",
    drive_reconnect_msg:
      "Google Drive 存取已過期。請中斷連線後重新連線。",
    drive_disconnect_confirm_title: "中斷 Google Drive 連線？",
    drive_disconnect_confirm_msg:
      "此操作會移除此裝置上的 Google 登入連線。加密備份檔案仍會保留在 Google Drive，直至由使用者自行刪除。",
    drive_restore_found_title: "從 Google Drive 還原？",
    drive_restore_found_msg:
      "Google Drive 中找到備份。要立即還原嗎？此操作會<strong>取代</strong>此裝置上的所有資料，並需要輸入 PIN 碼。",
    drive_restore_confirm: "還原備份",
    drive_restore_skip: "保留裝置上的資料",
    drive_restore_not_found_title: "找不到 Google Drive 備份",
    drive_restore_not_found_msg:
      "已成功連線至 Google Drive，但找不到 My Cycle Keeper 的備份。",

    onboard_sub: "在裝置上私密記錄月經週期",
    onboard_tagline:
      "記錄經血量、情緒及症狀。資料只儲存在裝置上；免費使用，沒有廣告或追蹤。",
    beta_label: "測試版",
    beta_warning_text:
      "本應用程式仍在開發中，功能可能變更，也可能出現錯誤。",
    ob_last_period: "最近一次月經的第一天",
    ob_cycle_len: "平均週期長度（天）",
    ob_period_dur: "平均經期天數",
    pin_setup_title: "🔒 設定 4 位數 PIN 碼",
    pin_setup_sub_1: "所有資料均以 PIN 碼在裝置上加密。",
    pin_setup_sub_2: "My Cycle Keeper 不會將資料傳送到裝置以外。",
    pin_setup_sub_3: "如忘記 PIN 碼，資料將無法復原，重設時亦會被刪除。",
    onboard_start_btn: "開始記錄",
    privacy_note_aes: "採用 AES-256-GCM 加密。",
    privacy_note_rest:
      "資料不會離開裝置。無需帳戶、沒有追蹤，並可免費使用。",
    timeout_before: "⏱️ 閒置",
    timeout_after: "秒後工作階段將結束 — 點按以延長",

    flow_spotting: "微量血絲",
    flow_light: "少量",
    flow_medium: "中等",
    flow_heavy: "大量",
    flow_very_heavy: "非常大量",
    log_add_entry: "新增記錄",
    log_edit_entry: "編輯記錄",
    log_auto_save: "變更會自動儲存",
    log_not_recorded: "未記錄",
    log_clear: "清除",
    log_none: "沒有",
    log_no_pain: "沒有疼痛",
    log_note: "備註",
    log_add_note: "新增備註",
    log_delete_entry: "刪除記錄",
    log_done: "完成",
    log_delete_title: "刪除此記錄？",
    log_delete_message: "將刪除此日期記錄的經血量、疼痛、情緒及備註。",
    log_entry_deleted: "記錄已刪除",
    log_saved: "已儲存 ✓",
    log_saving: "儲存中…",
    log_estimated_flow: "經血量暫時估算為「少量」，請選擇一個等級以確認。",
    print_options_title: "列印月經紀錄",
    print_options_intro: "月經日期及持續天數會固定包括在內，其他資料可自行選擇。",
    print_options_symptoms: "包括症狀資料",
    print_options_symptoms_hint: "經血量、疼痛及情緒摘要",
    print_options_notes: "包含備註",
    print_options_notes_hint: "每日私人備註",
    continue: "繼續",

    settings_saved_toast: "設定已儲存",
    status_no_data_hint:
      "開始記錄月經後即可查看統計。",
    status_import_hint: "或匯入您的資料",

    storage_full_title: "儲存空間已滿",
    storage_full_msg:
      "裝置儲存空間不足。請先匯出資料，或刪除部分紀錄以釋放空間。",

    forgot_pin_confirm2_title: "最後確認",
    forgot_pin_confirm2_msg:
      "所有月經追蹤資料將被永久刪除，無法復原。此操作不能撤銷。",
    forgot_pin_confirm2_btn: "刪除所有資料",

    no_cycle_history: "尚未有週期紀錄。請至少記錄兩次月經。",
    history_showing: "顯示最近 {shown} 個週期（共 {total} 個）",
    predictions_tab: "未來月經預測",
    predictions_empty: "請至少記錄一次月經開始日期，以查看預測。",
    history_col_start: "開始",
    history_col_end: "結束",
    history_col_dates: "日期",
    history_col_period: "經期",
    history_col_cycle: "週期",
    view_all_history: "查看全部",
    share_history: "分享",
    share_history_subject: "近期月經日期",
    share_history_intro: "最近 6 次月經（開始日–結束日）：",
    share_history_empty: "尚無可分享的經期歷史。",
    print_summary: "列印摘要",
    print_summary_title: "My Cycle Keeper — 月經週期摘要",
    print_summary_generated: "產生日期：{date}",
    print_summary_stats_title: "摘要",
    print_summary_next_period: "下次預計月經",
    print_summary_col_symptoms: "備註",
    print_summary_avg_pain: "平均疼痛：{value}/10",
    print_summary_avg_mood: "平均情緒：{value}/100",
    print_summary_notes_count_many: "{n}則備註",
    print_summary_disclaimer:
      "本摘要根據使用者自行記錄的資料產生，僅供個人參考，並非醫療建議。涉及臨床或醫療決定時，請諮詢合資格的醫療專業人員。",

    legend_short: "較短（少於 26 天）",
    legend_normal: "一般（26–32 天）",
    legend_long: "較長（超過 32 天）",

    // 補齊原本會回退為英文的繁體中文翻譯
    incorrect_pin_one: "PIN 碼不正確，還可嘗試 {remaining} 次。",
    period_expected_in_one: "距離預計月經開始還有 {n} 天",
    history_days_one: "{n} 天",
    backup_days_ago_one: "上次備份：{n} 天前",
    backup_overdue_one: "上次備份：{n} 天前 — 建議立即備份",
    stat_rolling_title: "最近 6 個月",
    stat_rolling_hint: "用於週期預測",
    stat_overall_title: "所有紀錄",
    stat_cycles_count: "週期數",
    cycle_shift_longer: "上一次週期比最近 6 個月的平均值長 {days} 天",
    cycle_shift_shorter: "上一次週期比最近 6 個月的平均值短 {days} 天",
    cycle_shift_tooltip: "與最近 6 個月平均值相差 {days} 天",
    cycle_spread_caution: "最近 6 個月的週期介乎 {min} 至 {max} 天，相差 {spread} 天。輕微變動屬常見情況。",
    cycle_spread_irregular: "最近 6 個月的週期介乎 {min} 至 {max} 天，相差 {spread} 天。不同週期之間相差超過 9 天，可能屬於不規律。",
    cycle_spread_caution_short: "週期有變動：相差 {spread} 天（最近 6 個月）",
    cycle_spread_irregular_short: "可能不規律：相差 {spread} 天（最近 6 個月）",
    history_current: "進行中",
    legend_shifted: "有變動（與 6 個月平均相差超過 3 天）",
    settings_autofill_auto: "自動",
    autofill_banner_msg_one: "已自動填入 {n} 天的「少量」經血紀錄。",
    ob_setup_title: "設定月經週期",
    ob_setup_hint: "輸入最近一次月經開始日期，即可顯示初步預測；亦可匯入現有資料，或略過日期直接開始記錄。",
    ob_continue_btn: "繼續 →",
    onboard_restore_backup: "還原加密備份",
    onboard_restore_drive: "從 Google Drive 還原",
    ob_back_btn: "← 返回",
    app_import_title: "從其他應用程式匯入",
    app_import_source_intro: "請選擇資料原本由哪個應用程式匯出。",
    app_import_source_mycalendar: "My Calendar",
    app_import_source_drip: "drip",
    app_import_file_hint_mycalendar: "在 My Calendar 前往「設定 → 匯出給醫生的文件」，再於此載入產生的 .txt 檔案。",
    app_import_file_hint_drip: "在 drip 點選右上角的三點選單，前往「設定 → 資料」，再於此載入匯出的 .csv 檔案。",
    app_import_choose_file: "選擇檔案",
    app_import_back: "返回",
    app_import_review_counts: "共找到 {periods} 次月經，其中 {withFlow} 次有原始經血量資料。",
    app_import_review_warning: "有 {count} 次月經沒有經血量資料。可設定模式補上，或直接保留原始資料並繼續。",
    app_import_pattern_label: "經血量模式（1–4；0＝少量出血）",
    app_import_pattern_hint: "若模式長於經期，多出的天數會被忽略；若短於經期，最後一個等級會套用至餘下天數。",
    app_import_flow_mode_legend: "原始資料已有經血量時",
    app_import_flow_overwrite: "覆寫現有經血量",
    app_import_flow_fill_gaps: "只填補沒有經血量的月經紀錄",
    app_import_continue: "繼續",
    app_import_report_unmapped: "未能轉換的情緒",
    app_import_report_leftovers: "其他未支援資料",
    app_import_copy: "複製報告",
    app_import_export_txt: "匯出 .txt",
    app_import_export_csv: "匯出 .csv",
    app_import_done: "完成",
    app_import_failed_title: "匯入失敗",
    app_import_empty_title: "沒有可匯入的資料",
    app_import_empty_msg: "檔案中沒有可用資料。",
    app_import_done_msg: "已成功匯入 {days} 天的資料。",
    app_import_merge_title: "匯入資料",
    app_import_merge_msg: "找到 {days} 天的資料。請選擇套用方式。",
    app_import_merge: "合併（保留現有資料）",
    app_import_replace: "取代（使用匯入資料）",
    app_import_report_summary_source: "來源：{source}",
    app_import_report_summary_periods: "月經次數：{count}",
    app_import_report_summary_flow_days: "有經血量的日數：{count}",
    app_import_report_summary_mood_days: "有情緒記錄的日數：{count}",
    app_import_report_summary_leftover_days: "有其他資料的日數：{count}",
    app_import_report_summary_unmapped: "未能轉換的情緒：{count}",
    app_import_report_summary_imported: "已匯入日數：{count}",
    app_import_report_result: "已匯入 {periods} 個週期、共 {days} 天的月經資料。",
    app_import_report_extras_note: "部分資料類型目前尚未支援。以下列出相關內容；如需保留，可複製或匯出，之後再加入備註。",
    app_import_copy_success: "報告已複製到剪貼簿",
    app_import_copy_failed: "無法複製報告",
    drip_import_panel_intro: "從 drip 相容的 CSV 檔案匯入週期紀錄。請在 drip 選擇「選單 → 匯出資料 → 匯出為 CSV」。",
    drip_import_panel_before: "My Calendar 及 drip 的匯出資料均可在「設定 → 從其他應用程式匯入」直接匯入。",
    drip_import_choose_csv: "選擇 CSV 檔案",
    drip_import_mycalendar_label: "使用 My Calendar 而不是 drip？",
    drip_import_mycalendar_link: "前往設定中的「從其他應用程式匯入」→",
    print_summary_notes_count_one: "{n} 則備註",

    flow_question: "今天的經血量是多少？",
    log_force_new_cycle: "另作一次新的月經記錄",
    log_force_new_cycle_hint:
      "只有在已設定經血量時才會生效。若應用程式把這次紀錄與最近一次月經合併，可使用此選項將其分開。",
    security_info:
      "所有資料均會先以 PIN 碼加密，再儲存在裝置上。Cycle Keeper 使用瀏覽器 HTTPS 同樣採用的標準技術 <strong>Web Crypto API</strong>。<br><br>資料不會傳送到任何伺服器，也不需要帳戶或使用數據分析。",
    data_persistence:
      "⚠️ <strong>資料保存方式：</strong>資料儲存在 IndexedDB。清除瀏覽器快取不會刪除資料，但在瀏覽器設定中清除「網站資料」或「Cookie 與網站資料」會刪除所有月經週期資料。請先匯出備份。",
    about_info_html:
      "<strong>My Cycle Keeper</strong> 是 <a href=\"https://github.com/pythonime-lab/yourcyclekeeper\" target=\"_blank\" rel=\"noopener\" class=\"accessibility-link\">Your Cycle Keeper</a> 的個人分支版本。Your Cycle Keeper 是由 <a href=\"https://github.com/pythonime-lab\" target=\"_blank\" rel=\"noopener\" class=\"accessibility-link\">pythonime-lab</a> 開發的開源月經追蹤應用程式；此版本則依個人偏好作出調整。<br><br>若覺得實用，可考慮在 <a href=\"https://github.com/pythonime-lab\" target=\"_blank\" rel=\"noopener\" class=\"accessibility-link\">GitHub</a> 支持原始開發者。<br><br>Your Cycle Keeper 與本分支均免費使用，沒有廣告、追蹤或資料收集。所有估算僅供個人參考，不可作為避孕依據。壓力、疾病及藥物都可能影響週期時間。<br><br><strong>版本：</strong>1.0.0-beta<br><strong>授權：</strong>GNU General Public License v3.0",
    fork_title: "關於此分支",
    fork_info_html:
      "此個人分支新增近 6 個月滾動平均預測、從 My Calendar／drip 匯入資料、匯出為 drip 格式或一般 CSV、自動填入經期、月經延遲提示、主題／介面選項，以及精簡的週期紀錄電郵分享。<br><br>部分原始功能已移除；預測方式及 CSV 格式參考 bloodyhealth 的 <a href=\"https://gitlab.com/bloodyhealth/drip\" target=\"_blank\" rel=\"noopener\" class=\"accessibility-link\">drip</a>。此版本以 AI 輔助開發，<strong>請自行評估使用風險。</strong><br><br><small style=\"color: var(--text-muted)\"><a href=\"https://fishese.github.io/tools/\" target=\"_blank\" rel=\"noopener\" class=\"accessibility-link\">0oo.fish.oo0</a></small>",
    support_info:
      "此應用程式是 pythonime-lab 開發的 <strong>Your Cycle Keeper</strong> 的分支版本。若覺得實用，可考慮支持原始開發者。",
    support_via: "支持方式",
    support_footer:
      "支持有助原始 Your Cycle Keeper 專案持續維護，並維持無廣告運作。",
    privacy_info_html:
      "My Cycle Keeper <strong>完全不收集資料</strong>。<br>&nbsp;• 所有資料只儲存在此裝置<br>&nbsp;• 不使用伺服器、帳戶或雲端儲存<br>&nbsp;• 不使用數據分析、追蹤或遙測<br>&nbsp;• 沒有廣告或第三方程式碼<br>&nbsp;• 資料不會傳送到裝置以外<br>&nbsp;• 以 PIN 碼透過 AES-256-GCM 加密<br><br>健康資料只屬於使用者本人。",
    disclaimer_info_html:
      "⚠️ <strong>本應用程式會根據一般生物規律及已記錄資料估算月經週期。</strong>相關內容<em>不是</em>醫療建議，也不能取代專業醫療諮詢。<br><br>My Cycle Keeper 會根據週期模式預測下次月經及排卵時間，但實際時間可能受壓力、疾病、藥物及其他因素影響。<br><br>請<strong>勿</strong>將本應用程式作為避孕方法或受孕保證。涉及醫療決定時，請諮詢合資格的醫療專業人員。",
    accessibility_info_html:
      "My Cycle Keeper 依循 <strong>WCAG 2.0 無障礙標準</strong>：<br><br>&nbsp;• <strong>Tab／Shift+Tab：</strong>在互動項目之間前後移動<br>&nbsp;• <strong>方向鍵：</strong>在日曆日期之間移動<br>&nbsp;• <strong>Enter／Space：</strong>啟用按鈕及連結<br>&nbsp;• <strong>Escape：</strong>關閉對話框並將焦點移回原項目<br>&nbsp;• <strong>PIN 碼輸入：</strong>支援數字 0–9 及 Backspace<br>&nbsp;• <strong>表單控制項：</strong>支援以鍵盤操作輸入欄、選單及文字區域<br>&nbsp;• <strong>螢幕閱讀器：</strong>使用語意化 HTML、適當的 ARIA 標籤及角色<br>&nbsp;• <strong>焦點管理：</strong>提供清晰的焦點標示及合理的操作順序",
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
    const html = t(el.dataset.i18nHtml);
    el.innerHTML = html;
    // Hide empty translated boxes (e.g. retired keys left as "")
    if (!String(html).trim()) {
      el.classList.add("hidden");
    } else {
      el.classList.remove("hidden");
    }
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
  });
}
