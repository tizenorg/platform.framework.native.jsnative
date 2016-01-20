%define cmake_tmp cmake_build_tmp

Name:       jsnative
Summary:    Node.js modules for JSNative apps
Version:    0.9.0
Release:    1
Group:      Development/Libraries
License:    Apache-2.0 and BSD-3-Clause
URL:        https://www.tizen.org
Source0:    %{name}-%{version}.tar.gz
Source1:    %{name}.manifest

BuildRequires: cmake
BuildRequires: pkgconfig(nodejs)
BuildRequires: pkgconfig(jsoncpp)
BuildRequires: pkgconfig(xwalk-extensions-common)
BuildRequires: pkgconfig(dlog)
BuildRequires: pkgconfig(libsmack)
BuildRequires: pkgconfig(cynara-client)
BuildRequires: pkgconfig(appcore-efl)
BuildRequires: pkgconfig(aul)
BuildRequires: pkgconfig(pkgmgr-info)
BuildRequires: pkgconfig(bundle)
BuildRequires: pkgconfig(notification)
BuildRequires: pkgconfig(capi-system-device)
BuildRequires: pkgconfig(capi-appfw-application)
BuildRequires: pkgconfig(capi-appfw-app-manager)
BuildRequires: pkgconfig(capi-appfw-package-manager)
BuildRequires: pkgconfig(capi-message-port)
BuildRequires: pkgconfig(capi-media-sound-manager)
BuildRequires: pkgconfig(capi-system-device)
BuildRequires: pkgconfig(capi-system-system-settings)
BuildRequires: pkgconfig(storage)
BuildRequires: pkgconfig(capi-system-info)
BuildRequires: pkgconfig(capi-system-runtime-info)

Requires: nodejs

%description
Node.js modules for JSNative apps

%prep
%setup -q
cp %{SOURCE1} .

%build

# node-xwalk
mkdir -p cmake_build_tmp
cd cmake_build_tmp
cmake .. \
        -DCMAKE_INSTALL_PREFIX=%{_prefix}

make %{?jobs:-j%jobs}


%install
rm -rf %{buildroot}

mkdir -p %{buildroot}%{_datadir}/license
cp LICENSE %{buildroot}%{_datadir}/license/%{name}
cat LICENSE.BSD >> %{buildroot}%{_datadir}/license/%{name}

cd cmake_build_tmp
%make_install

%clean
rm -rf %{buildroot}

%files
%manifest %{name}.manifest
%{_datadir}/license/%{name}
%{_prefix}/lib/node/*
