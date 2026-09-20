; Resep installer PelangganKu (Inno Setup).
; Menghasilkan PelangganKu-Setup-x.y.z.exe: satu berkas yang tinggal
; dobel-klik, memasang aplikasi, membuat pintasan, dan menyediakan
; penghapus pemasangan. Pengguna tidak pernah melihat Python.

#define NamaApp        "PelangganKu"
#define PenerbitApp    "Purify Beaute"
#define UrlApp         "https://github.com/purifybeaute-ops/SS-TO-DATA-BUYER"
#define ExeApp         "PelangganKu.exe"
#ifndef VersiApp
  #define VersiApp     "0.1.0"
#endif

[Setup]
AppId={{8F3A1C22-9B4E-4E5A-9D7C-PELANGGANKU01}
AppName={#NamaApp}
AppVersion={#VersiApp}
AppPublisher={#PenerbitApp}
AppPublisherURL={#UrlApp}
AppSupportURL={#UrlApp}
DefaultDirName={autopf}\{#NamaApp}
DefaultGroupName={#NamaApp}
DisableProgramGroupPage=yes
OutputDir=..\dist_installer
OutputBaseFilename=PelangganKu-Setup-{#VersiApp}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
; dipasang per-pengguna supaya tidak meminta hak administrator
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayName={#NamaApp}
SetupIconFile=ikon.ico
UninstallDisplayIcon={app}\{#ExeApp}

[Languages]
Name: "indonesia"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Buat pintasan di Desktop"; \
  GroupDescription: "Pintasan:"; Flags: checkedonce

[Files]
Source: "..\dist\PelangganKu\*"; DestDir: "{app}"; \
  Flags: ignoreversion recursesubdirs createallsubdirs
Source: "PANDUAN.txt"; DestDir: "{app}"; Flags: ignoreversion isreadme

[Icons]
Name: "{group}\{#NamaApp}";           Filename: "{app}\{#ExeApp}"
Name: "{group}\Panduan {#NamaApp}";   Filename: "{app}\PANDUAN.txt"
Name: "{group}\Hapus {#NamaApp}";     Filename: "{uninstallexe}"
Name: "{autodesktop}\{#NamaApp}";     Filename: "{app}\{#ExeApp}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#ExeApp}"; \
  Description: "Jalankan {#NamaApp} sekarang"; \
  Flags: nowait postinstall skipifsilent

[UninstallDelete]
; Berkas program dihapus, TAPI data pelanggan di %LOCALAPPDATA%\PelangganKu
; sengaja TIDAK disentuh — pengguna tidak boleh kehilangan databasenya
; hanya karena menghapus atau memasang ulang aplikasi.
Type: filesandordirs; Name: "{app}\_internal\__pycache__"

[Messages]
indonesia.WelcomeLabel2=Aplikasi ini akan memasang [name/ver] di komputer Anda.%n%nSeluruh data pembeli disimpan di komputer ini dan tidak pernah dikirim ke mana pun.
