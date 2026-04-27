/* ── Tiginer Portal — i18n Engine ───────────────── */
const TIGINER_I18N = {
  tr: {
    // Navbar
    nav_features: 'Özellikler',
    nav_solutions: 'Çözümler',
    nav_packages: 'Paketler',
    nav_requirements: 'Sistem',
    nav_demo: 'Demo Talep Et',
    nav_download: 'İndir',

    // Hero
    hero_badge: 'v2.0 — Yeni Nesil Ağ Yönetimi',
    hero_title_1: 'Ağ Altyapınızı',
    hero_title_2: 'Uçtan Uca',
    hero_title_3: ' Kontrol Edin',
    hero_sub: 'Keşif, izleme, alarm, yapılandırma yedekleme, uyumluluk denetimi ve otomasyon — kurumsal ağ yönetiminin tüm bileşenleri tek bir platformda.',
    hero_cta_demo: 'Canlı Demo İzle',
    hero_cta_download: 'Hemen Kur',

    // Dashboard Mockup
    mock_devices: 'Aktif Cihaz',
    mock_uptime: 'Uptime',
    mock_alarms: 'Aktif Alarm',
    mock_traffic: 'Toplam Trafik',
    mock_bandwidth: 'Bant Genişliği',
    mock_cpu: 'CPU Kullanımı',

    // Trust bar
    trust_label: 'Kurumsal müşterilerimizin güvendiği platform',
    trust_devices: 'Yönetilen Cihaz',
    trust_uptime: 'Uptime Garantisi',
    trust_monitoring: 'Kesintisiz İzleme',
    trust_protocol: 'Güvenli Protokol',
    trust_setup: 'Kurulum Süresi',

    // Features
    feat_badge: 'Özellikler',
    features_title: 'Ağ Yönetiminde İhtiyacınız Olan Her Şey',
    features_sub: 'Tek platform, sınırsız kontrol. SNMP keşiften uyumluluk denetimine kadar.',
    feat_discover: 'Otomatik Keşif',
    feat_discover_desc: 'SNMP v1/v2c/v3 ve ping taraması ile ağdaki tüm cihazları otomatik keşfedin, envantere ekleyin.',
    feat_monitor: 'Gerçek Zamanlı İzleme',
    feat_monitor_desc: 'CPU, bellek, bant genişliği, arayüz trafiği — tüm metrikleri canlı dashboard\'larda izleyin.',
    feat_alarm: 'Akıllı Alarm Sistemi',
    feat_alarm_desc: 'Eşik değerleri, eskalasyon kuralları, e-posta/webhook/syslog bildirim kanalları.',
    feat_topology: 'Topoloji Haritası',
    feat_topology_desc: 'Ağ topolojinizi otomatik çizin, katman bazlı görünüm ve canlı durum takibi.',
    feat_backup: 'Yapılandırma Yedekleme',
    feat_backup_desc: 'Cihaz konfigürasyonlarını zamanlı yedekleyin, diff karşılaştırmasıyla değişiklikleri izleyin.',
    feat_compliance: 'Uyumluluk Denetimi',
    feat_compliance_desc: 'Güvenlik politikalarına uyumu SCAP ile denetleyin, uyumsuzlukları raporlayın.',
    feat_automation: 'Otomasyon',
    feat_automation_desc: 'Toplu komut yürütme, zamanlanmış görevler, Ansible ve şablon tabanlı yapılandırma.',
    feat_netflow: 'NetFlow Analizi',
    feat_netflow_desc: 'Trafik akış analizi, uygulama bazlı bant genişliği kullanımı ve anomali tespiti.',
    feat_reports: 'Raporlama',
    feat_reports_desc: 'Performans, kapasite ve uyumluluk raporlarını otomatik oluşturun, zamanlı gönderin.',

    // Why Tiginer
    why_badge: 'Neden Tiginer?',
    why_title: 'Farkımız Detaylarda Gizli',
    why_sub: 'Her detayı düşünerek tasarlandı, operasyonel verimliliğiniz için optimize edildi.',
    why_1_title: '5 Dakikada Kurulum',
    why_1_desc: 'Linux sunucuda tek komutla Docker tabanlı kurulum. Karmaşık bağımlılık yok, Windows Server da desteklenir.',
    why_2_title: 'On-Premise & Güvenli',
    why_2_desc: 'Verileriniz kendi sunucunuzda kalır. Bulut bağımlılığı yok, tam kontrol sizde.',
    why_3_title: 'Türkçe & Çok Dilli',
    why_3_desc: 'Türkçe dahil 10 dil desteği. Yerel ekibiniz kendi dilinde rahatça kullanır.',
    why_4_title: 'Modüler Mimari',
    why_4_desc: 'İhtiyacınız olan modülleri aktif edin. Lisansınız büyüdükçe özellikler de büyüsün.',
    why_5_title: 'Gerçek Zamanlı',
    why_5_desc: 'WebSocket tabanlı canlı güncelleme. Sayfa yenilemeden anlık metrik ve alarm akışı.',
    why_6_title: 'REST API & Entegrasyon',
    why_6_desc: 'Tam REST API, webhook\'lar, Syslog, JIRA ve ServiceDesk entegrasyonları.',

    // Pricing
    pricing_badge: 'Fiyatlandırma',
    pricing_title: 'Ağınızın Büyüklüğüne Göre Seçin',
    pricing_sub: 'Her ölçekte esnek lisans modeli. İhtiyacınız arttıkça yükseltin.',
    pricing_device_limit: 'cihaza kadar',
    pricing_unlimited: 'Sınırsız cihaz',
    plan_starter: 'Başlangıç',
    plan_basic_desc: 'Küçük ağlar için temel izleme ve yönetim',
    plan_popular: 'En Popüler',
    plan_recommended: 'Önerilen',
    plan_pro_desc: 'Büyüyen ağlar için tam özellik seti',
    plan_full: 'Tam Kapasite',
    plan_enterprise_desc: 'Kurumsal ağlar için eksiksiz çözüm',
    plan_b1: 'Otomatik cihaz keşfi',
    plan_b2: 'Canlı izleme ve dashboard',
    plan_b3: 'Alarm bildirimleri',
    plan_b4: 'Topoloji haritası',
    plan_b5: 'Yapılandırma yedekleme',
    plan_b6: 'Otomasyon',
    plan_b7: 'Uyumluluk denetimi',
    plan_p1: 'Tüm Starter özellikleri',
    plan_p3: 'Yapılandırma yedekleme',
    plan_p4: 'Config denetimi & diff',
    plan_p5: 'Otomasyon & şablonlar',
    plan_p6: 'Gelişmiş raporlar',
    plan_p7: 'NetFlow & SCAP',
    plan_p_api: 'REST API erişimi',
    plan_e2: 'Tüm Professional özellikleri',
    plan_e3: 'Tam uyumluluk denetimi (SCAP)',
    plan_e4: 'NetFlow / sFlow analizi',
    plan_e_ansible: 'Ansible entegrasyonu',
    plan_e6: 'Öncelikli destek',
    plan_e7: 'Özel entegrasyon & webhook',
    plan_e_sla: 'SLA garantisi',
    cta_contact_sales: 'Satış Ekibine Ulaşın',

    // CTA
    cta_title_1: 'Ağ Operasyonlarınızı',
    cta_title_2: 'Dönüştürmeye',
    cta_title_3: ' Hazır mısınız?',
    cta_sub: 'Ücretsiz demo ile Tiginer\'ı keşfedin. Kurulum ve teknik destek ekibimiz yanınızda.',
    cta_contact: 'Bize Ulaşın',

    // Footer
    footer_desc: 'Kurumsal Ağ İzleme ve Yönetim Platformu',
    footer_platform: 'Platform',
    footer_features: 'Özellikler',
    footer_solutions: 'Çözümler',
    footer_packages: 'Paketler',
    footer_resources: 'Kaynaklar',
    footer_download: 'İndirme',
    footer_support: 'Teknik Destek',
    footer_contact: 'İletişim',
    footer_demo: 'Demo Talep',
    footer_rights: 'Tüm hakları saklıdır.',
    footer_privacy: 'Gizlilik Politikası',
    footer_terms: 'Kullanım Koşulları',

    // Demo page
    demo_title: 'Ücretsiz Demo Talep Edin',
    demo_sub: 'Formu doldurun, ekibimiz en kısa sürede sizinle iletişime geçecektir.',
    demo_name: 'Ad Soyad',
    demo_company: 'Firma Adı',
    demo_email: 'E-posta',
    demo_phone: 'Telefon',
    demo_device_count: 'Tahmini Cihaz Sayısı',
    demo_select: 'Seçiniz',
    demo_message: 'Mesajınız',
    demo_message_placeholder: 'İhtiyaçlarınızı kısaca açıklayabilirsiniz...',
    demo_submit: 'Demo Talep Et',
    demo_sending: 'Gönderiliyor...',
    demo_success: 'Demo talebiniz başarıyla alındı! En kısa sürede sizinle iletişime geçeceğiz.',

    // Download page
    dl_badge: 'Son Sürüm: v2.0',
    dl_title_1: 'Tiginer\'i',
    dl_title_2: 'Kurun',
    dl_sub: 'Kurulum paketini indirin, Docker ile dakikalar içinde çalıştırın. Kaynak koda erişim gerektirmez.',
    dl_win_title: 'Windows (x64)',
    dl_win_desc: 'Windows Server 2019+, Windows 10/11 uyumlu. Docker Desktop gerektirir.',
    dl_win_btn: 'Windows İndir (.zip)',
    dl_linux_title: 'Linux (x64)',
    dl_linux_desc: 'Ubuntu 22+, Debian 12+, CentOS 9+, RHEL 9+ uyumlu. Docker Engine gerektirir.',
    dl_linux_btn: 'Linux İndir (.tar.gz)',
    dl_docs_title: 'Kurulum Rehberi',
    dl_docs_desc: 'Adım adım kurulum, registry girişi, SSL yapılandırması, yedekleme ve güncelleme talimatları.',
    dl_docs_btn: 'Kurulum Dokümanı İndir',
    dl_steps_title: 'Hızlı Kurulum — 5 Adım',
    dl_step1: 'Paketi indirin ve sunucunuzda bir klasöre çıkartın.',
    dl_step2: 'Ortam değişkenlerini ayarlayın: .env dosyasındaki şifreleri doldurun.',
    dl_step3: 'Registry giriş yapın: size verilen token\'ı girin.',
    dl_step4: 'Kurulum scriptini çalıştırın.',
    dl_step5_1: 'Tarayıcıdan',
    dl_step5_2: 'gidin, lisans anahtarınızı Ayarlar > Lisans\'a girin.',
    dl_security_title: 'Güvenlik & Dağıtım Modeli',
    dl_sec_protected: 'Korunmuş',
    dl_sec_protected_desc: 'Kaynak kod pakette yer almaz',
    dl_sec_encrypted: 'Şifrelenmiş',
    dl_sec_encrypted_desc: 'Obfuscated runtime + native binary',
    dl_sec_licensed: 'Lisanslı',
    dl_sec_licensed_desc: 'Periyodik lisans doğrulaması',
    dl_req_title: 'Sistem Gereksinimleri',
    dl_req_cpu: 'CPU (4+ önerilen)',
    dl_req_ram: 'RAM (8 GB önerilen)',
    dl_req_disk: 'Disk (SSD önerilen)',
    dl_req_docker: 'Docker v24+ Compose v2+',
    dl_license_title: 'Lisans Anahtarı Gerekiyor mu?',
    dl_license_sub: 'Henüz lisansınız yoksa demo talep edin, size özel lisans anahtarı oluşturalım.',

    // Sistem Gereksinimleri
    sys_badge: 'Sistem Gereksinimleri',
    sys_title: 'Donanım & Ortam',
    sys_sub: 'Tiginer NMS, ağınızın büyüklüğüne göre ölçeklenir. Her paket için önerilen yapılandırmalar:',
    sys_starter_desc: '≤ 50 cihaz · küçük ofis / şube',
    sys_pro_desc: '50–250 cihaz · tipik kurumsal ağ',
    sys_ent_desc: '250–1000+ cihaz · servis sağlayıcı / büyük kurum',
    sys_vcpu: 'vCPU',
    sys_ram: 'RAM',
    sys_disk_ssd: 'SSD disk',
    sys_disk_nvme: 'NVMe SSD',
    sys_os_linux: 'Ubuntu 22.04+ / Debian 12 / RHEL 9',
    sys_docker: 'Docker Engine 24+ (otomatik kurulur)',
    sys_net_basic: 'İnternet erişimi (kurulum + lisans + güncelleme)',
    sys_virtualization: 'Proxmox / VMware / Hyper-V uyumlu',
    sys_ports: 'Açık portlar: 3002 (Web UI), 161/162 SNMP, 514 Syslog, 2055 NetFlow',
    sys_ha: 'Yüksek erişilebilirlik (HA) destekli',
    sys_dedicated_db: 'Ayrılmış DB sunucusu önerilir',
    sys_ldap: 'LDAP/AD entegrasyonu & SSO',
    sys_note_install_title: 'Hızlı Kurulum',
    sys_note_install_desc: 'Tek komut ile ~10 dakikada kurulum tamamlanır (~1.5 GB indirme).',
    sys_note_vm_title: 'Sanal Makine Dostu',
    sys_note_vm_desc: 'Proxmox, VMware ESXi, Hyper-V ve KVM üzerinde tam destek. Snapshot & canlı taşıma.',
    sys_note_offline_title: 'Offline / Air-gap',
    sys_note_offline_desc: 'İnternet erişimi olmayan kurumsal ağlar için lokal mirror desteği mevcuttur.',
  },

  en: {
    // Navbar
    nav_features: 'Features',
    nav_solutions: 'Solutions',
    nav_packages: 'Pricing',
    nav_requirements: 'System',
    nav_demo: 'Request Demo',
    nav_download: 'Download',

    // Hero
    hero_badge: 'v2.0 — Next-Gen Network Management',
    hero_title_1: 'Take Full Control',
    hero_title_2: 'End-to-End',
    hero_title_3: ' of Your Network',
    hero_sub: 'Discovery, monitoring, alerting, configuration backup, compliance auditing and automation — all components of enterprise network management in one platform.',
    hero_cta_demo: 'Watch Live Demo',
    hero_cta_download: 'Install Now',

    // Dashboard Mockup
    mock_devices: 'Active Devices',
    mock_uptime: 'Uptime',
    mock_alarms: 'Active Alarms',
    mock_traffic: 'Total Traffic',
    mock_bandwidth: 'Bandwidth',
    mock_cpu: 'CPU Usage',

    // Trust bar
    trust_label: 'Trusted by enterprise customers worldwide',
    trust_devices: 'Managed Devices',
    trust_uptime: 'Uptime Guarantee',
    trust_monitoring: 'Non-Stop Monitoring',
    trust_protocol: 'Secure Protocol',
    trust_setup: 'Setup Time',

    // Features
    feat_badge: 'Features',
    features_title: 'Everything You Need for Network Management',
    features_sub: 'One platform, unlimited control. From SNMP discovery to compliance auditing.',
    feat_discover: 'Auto Discovery',
    feat_discover_desc: 'Automatically discover all network devices via SNMP v1/v2c/v3 and ping scans, add to inventory.',
    feat_monitor: 'Real-Time Monitoring',
    feat_monitor_desc: 'CPU, memory, bandwidth, interface traffic — monitor all metrics on live dashboards.',
    feat_alarm: 'Smart Alert System',
    feat_alarm_desc: 'Thresholds, escalation rules, email/webhook/syslog notification channels.',
    feat_topology: 'Topology Map',
    feat_topology_desc: 'Auto-generate your network topology with layer-based views and live status tracking.',
    feat_backup: 'Configuration Backup',
    feat_backup_desc: 'Schedule device configuration backups, track changes with diff comparison.',
    feat_compliance: 'Compliance Auditing',
    feat_compliance_desc: 'Audit security policy compliance with SCAP, report non-conformities.',
    feat_automation: 'Automation',
    feat_automation_desc: 'Bulk command execution, scheduled tasks, Ansible and template-based configuration.',
    feat_netflow: 'NetFlow Analysis',
    feat_netflow_desc: 'Traffic flow analysis, application-level bandwidth usage and anomaly detection.',
    feat_reports: 'Reporting',
    feat_reports_desc: 'Automatically generate and schedule performance, capacity and compliance reports.',

    // Why Tiginer
    why_badge: 'Why Tiginer?',
    why_title: 'The Difference is in the Details',
    why_sub: 'Designed with every detail in mind, optimized for your operational efficiency.',
    why_1_title: 'Setup in 5 Minutes',
    why_1_desc: 'One-command Docker-based install on Linux. No complex dependencies, Windows Server also supported.',
    why_2_title: 'On-Premise & Secure',
    why_2_desc: 'Your data stays on your server. No cloud dependency, full control is yours.',
    why_3_title: 'Multi-Language',
    why_3_desc: 'Support for 10 languages including Turkish. Your team works comfortably in their own language.',
    why_4_title: 'Modular Architecture',
    why_4_desc: 'Activate the modules you need. As your license grows, so do your features.',
    why_5_title: 'Real-Time',
    why_5_desc: 'WebSocket-based live updates. Instant metric and alarm flow without page refresh.',
    why_6_title: 'REST API & Integration',
    why_6_desc: 'Full REST API, webhooks, Syslog, JIRA and ServiceDesk integrations.',

    // Pricing
    pricing_badge: 'Pricing',
    pricing_title: 'Choose Based on Your Network Size',
    pricing_sub: 'Flexible licensing for every scale. Upgrade as your needs grow.',
    pricing_device_limit: 'devices',
    pricing_unlimited: 'Unlimited devices',
    plan_starter: 'Starter',
    plan_basic_desc: 'Essential monitoring and management for small networks',
    plan_popular: 'Most Popular',
    plan_recommended: 'Recommended',
    plan_pro_desc: 'Full feature set for growing networks',
    plan_full: 'Full Capacity',
    plan_enterprise_desc: 'Complete solution for enterprise networks',
    plan_b1: 'Auto device discovery',
    plan_b2: 'Live monitoring & dashboard',
    plan_b3: 'Alarm notifications',
    plan_b4: 'Topology map',
    plan_b5: 'Configuration backup',
    plan_b6: 'Automation',
    plan_b7: 'Compliance auditing',
    plan_p1: 'All Starter features',
    plan_p3: 'Configuration backup',
    plan_p4: 'Config auditing & diff',
    plan_p5: 'Automation & templates',
    plan_p6: 'Advanced reports',
    plan_p7: 'NetFlow & SCAP',
    plan_p_api: 'REST API access',
    plan_e2: 'All Professional features',
    plan_e3: 'Full compliance auditing (SCAP)',
    plan_e4: 'NetFlow / sFlow analysis',
    plan_e_ansible: 'Ansible integration',
    plan_e6: 'Priority support',
    plan_e7: 'Custom integration & webhooks',
    plan_e_sla: 'SLA guarantee',
    cta_contact_sales: 'Contact Sales Team',

    // CTA
    cta_title_1: 'Ready to Transform',
    cta_title_2: 'Your Network',
    cta_title_3: ' Operations?',
    cta_sub: 'Explore Tiginer with a free demo. Our setup and technical support team is by your side.',
    cta_contact: 'Contact Us',

    // Footer
    footer_desc: 'Enterprise Network Monitoring & Management Platform',
    footer_platform: 'Platform',
    footer_features: 'Features',
    footer_solutions: 'Solutions',
    footer_packages: 'Pricing',
    footer_resources: 'Resources',
    footer_download: 'Download',
    footer_support: 'Technical Support',
    footer_contact: 'Contact',
    footer_demo: 'Request Demo',
    footer_rights: 'All rights reserved.',
    footer_privacy: 'Privacy Policy',
    footer_terms: 'Terms of Service',

    // Demo page
    demo_title: 'Request a Free Demo',
    demo_sub: 'Fill out the form and our team will contact you shortly.',
    demo_name: 'Full Name',
    demo_company: 'Company Name',
    demo_email: 'Email',
    demo_phone: 'Phone',
    demo_device_count: 'Estimated Device Count',
    demo_select: 'Select',
    demo_message: 'Your Message',
    demo_message_placeholder: 'Briefly describe your needs...',
    demo_submit: 'Request Demo',
    demo_sending: 'Sending...',
    demo_success: 'Your demo request has been received! We will contact you soon.',

    // Download page
    dl_badge: 'Latest Version: v2.0',
    dl_title_1: 'Install',
    dl_title_2: 'Tiginer',
    dl_sub: 'Download the setup package, run with Docker in minutes. No source code access required.',
    dl_win_title: 'Windows (x64)',
    dl_win_desc: 'Compatible with Windows Server 2019+, Windows 10/11. Requires Docker Desktop.',
    dl_win_btn: 'Download Windows (.zip)',
    dl_linux_title: 'Linux (x64)',
    dl_linux_desc: 'Compatible with Ubuntu 22+, Debian 12+, CentOS 9+, RHEL 9+. Requires Docker Engine.',
    dl_linux_btn: 'Download Linux (.tar.gz)',
    dl_docs_title: 'Setup Guide',
    dl_docs_desc: 'Step-by-step installation, registry login, SSL configuration, backup and update instructions.',
    dl_docs_btn: 'Download Setup Guide',
    dl_steps_title: 'Quick Setup — 5 Steps',
    dl_step1: 'Download and extract the package to a folder on your server.',
    dl_step2: 'Configure environment variables: fill in passwords in .env file.',
    dl_step3: 'Login to registry: enter the token provided to you.',
    dl_step4: 'Run the install script.',
    dl_step5_1: 'Open',
    dl_step5_2: 'in browser, enter your license key in Settings > License.',
    dl_security_title: 'Security & Distribution Model',
    dl_sec_protected: 'Protected',
    dl_sec_protected_desc: 'No source code in package',
    dl_sec_encrypted: 'Encrypted',
    dl_sec_encrypted_desc: 'Obfuscated runtime + native binary',
    dl_sec_licensed: 'Licensed',
    dl_sec_licensed_desc: 'Periodic license verification',
    dl_req_title: 'System Requirements',
    dl_req_cpu: 'CPU (4+ recommended)',
    dl_req_ram: 'RAM (8 GB recommended)',
    dl_req_disk: 'Disk (SSD recommended)',
    dl_req_docker: 'Docker v24+ Compose v2+',
    dl_license_title: 'Need a License Key?',
    dl_license_sub: 'If you don\'t have a license yet, request a demo and we\'ll create a custom license key for you.',

    // System Requirements
    sys_badge: 'System Requirements',
    sys_title: 'Hardware & Environment',
    sys_sub: 'Tiginer NMS scales with your network size. Recommended configurations per tier:',
    sys_starter_desc: '≤ 50 devices · small office / branch',
    sys_pro_desc: '50–250 devices · typical enterprise network',
    sys_ent_desc: '250–1000+ devices · service provider / large enterprise',
    sys_vcpu: 'vCPU',
    sys_ram: 'RAM',
    sys_disk_ssd: 'SSD disk',
    sys_disk_nvme: 'NVMe SSD',
    sys_os_linux: 'Ubuntu 22.04+ / Debian 12 / RHEL 9',
    sys_docker: 'Docker Engine 24+ (auto-installed)',
    sys_net_basic: 'Internet access (install + license + updates)',
    sys_virtualization: 'Proxmox / VMware / Hyper-V compatible',
    sys_ports: 'Open ports: 3002 (Web UI), 161/162 SNMP, 514 Syslog, 2055 NetFlow',
    sys_ha: 'High availability (HA) supported',
    sys_dedicated_db: 'Dedicated DB server recommended',
    sys_ldap: 'LDAP/AD integration & SSO',
    sys_note_install_title: 'Quick Install',
    sys_note_install_desc: 'Single command, ~10 minute setup (~1.5 GB download).',
    sys_note_vm_title: 'VM-Friendly',
    sys_note_vm_desc: 'Full support on Proxmox, VMware ESXi, Hyper-V and KVM. Snapshot & live migration.',
    sys_note_offline_title: 'Offline / Air-gap',
    sys_note_offline_desc: 'Local mirror support available for enterprise networks without internet access.',
  }
};

/* ── Language Engine ───────────────────────────────── */
(function () {
  'use strict';

  const STORAGE_KEY = 'tiginer_lang';
  const DEFAULT_LANG = 'tr';

  function getLang() {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang && TIGINER_I18N[urlLang]) return urlLang;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && TIGINER_I18N[stored]) return stored;
    const browserLang = navigator.language.slice(0, 2);
    if (TIGINER_I18N[browserLang]) return browserLang;
    return DEFAULT_LANG;
  }

  function setLang(lang) {
    if (!TIGINER_I18N[lang]) return;
    localStorage.setItem(STORAGE_KEY, lang);
    applyLang(lang);
  }

  function applyLang(lang) {
    const t = TIGINER_I18N[lang];
    if (!t) return;

    document.documentElement.lang = lang;

    // Update all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) {
        el.textContent = t[key];
      }
    });

    // Update all elements with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (t[key] !== undefined) {
        el.setAttribute('placeholder', t[key]);
      }
    });

    // Update all elements with data-i18n-label
    document.querySelectorAll('[data-i18n-label]').forEach(el => {
      const key = el.getAttribute('data-i18n-label');
      if (t[key] !== undefined) {
        el.setAttribute('aria-label', t[key]);
      }
    });

    // Update active lang button
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  // Expose globally
  window.tiginerI18n = { getLang, setLang, applyLang };

  // Auto-apply on load
  document.addEventListener('DOMContentLoaded', function () {
    const lang = getLang();
    applyLang(lang);

    // Bind lang buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        setLang(this.dataset.lang);
      });
    });
  });
})();
