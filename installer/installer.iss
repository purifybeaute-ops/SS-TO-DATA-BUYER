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
Type: filesandordirs; Name: "{app}\_internal\__pycache__"

[Code]
// ---------------------------------------------------------------------
//  Penghapusan data saat uninstall
//
//  Berkas program selalu dihapus. Data pelanggan TIDAK — kecuali pengguna
//  memintanya. Alasannya: memasang ulang atau memperbarui versi tidak boleh
//  menghilangkan database. Tapi kalau pengguna memang ingin bersih total,
//  data pribadi pembeli tidak boleh tertinggal diam-diam di komputernya.
// ---------------------------------------------------------------------

function FolderData(): String;
begin
  Result := ExpandConstant('{localappdata}\PelangganKu');
end;

function FolderCadangan(): String;
begin
  Result := ExpandConstant('{userdocs}\PelangganKu-Cadangan-') +
            GetDateTimeString('yyyy-mm-dd', #0, #0);
end;

procedure SalinIsiFolder(Sumber, Tujuan: String);
var
  Cari: TFindRec;
begin
  ForceDirectories(Tujuan);
  if FindFirst(Sumber + '\*', Cari) then begin
    try
      repeat
        if (Cari.Name <> '.') and (Cari.Name <> '..') then begin
          if (Cari.Attributes and FILE_ATTRIBUTE_DIRECTORY) <> 0 then
            SalinIsiFolder(Sumber + '\' + Cari.Name, Tujuan + '\' + Cari.Name)
          else
            FileCopy(Sumber + '\' + Cari.Name, Tujuan + '\' + Cari.Name, False);
        end;
      until not FindNext(Cari);
    finally
      FindClose(Cari);
    end;
  end;
end;

procedure CurUninstallStepChanged(CurStep: TUninstallStep);
var
  Data, Cadangan: String;
begin
  if CurStep <> usPostUninstall then Exit;

  Data := FolderData();
  if not DirExists(Data) then Exit;

  if MsgBox(
      'Hapus juga seluruh data pelanggan?' + #13#10#13#10 +
      'Data Anda tersimpan di:' + #13#10 + Data + #13#10#13#10 +
      'Pilih TIDAK kalau Anda berencana memasang PelangganKu lagi — ' +
      'database Anda akan tetap utuh dan langsung terbaca.' + #13#10#13#10 +
      'Pilih YA kalau Anda ingin bersih total. Data nama, nomor telepon, ' +
      'dan alamat pembeli akan dihapus permanen dan TIDAK BISA dikembalikan.',
      mbConfirmation, MB_YESNO or MB_DEFBUTTON2) <> IDYES then Exit;

  if MsgBox(
      'Simpan salinan cadangan dulu sebelum dihapus?' + #13#10#13#10 +
      'Salinannya akan diletakkan di folder Documents Anda, dan tetap ada ' +
      'setelah aplikasi dicopot.',
      mbConfirmation, MB_YESNO or MB_DEFBUTTON1) = IDYES then begin
    Cadangan := FolderCadangan();
    SalinIsiFolder(Data, Cadangan);
    if DirExists(Cadangan) then
      MsgBox('Cadangan tersimpan di:' + #13#10 + Cadangan,
             mbInformation, MB_OK)
    else begin
      MsgBox('Cadangan GAGAL dibuat, jadi data tidak jadi dihapus.' + #13#10 +
             'Data Anda masih utuh di:' + #13#10 + Data,
             mbError, MB_OK);
      Exit;
    end;
  end;

  DelTree(Data, True, True, True);
  if DirExists(Data) then
    MsgBox('Sebagian data tidak bisa dihapus, mungkin masih dipakai program lain.' +
           #13#10 + 'Coba hapus manual folder ini:' + #13#10 + Data,
           mbError, MB_OK)
  else
    MsgBox('Seluruh data pelanggan sudah dihapus.', mbInformation, MB_OK);
end;

[Messages]
indonesia.WelcomeLabel2=Aplikasi ini akan memasang [name/ver] di komputer Anda.%n%nSeluruh data pembeli disimpan di komputer ini dan tidak pernah dikirim ke mana pun.
