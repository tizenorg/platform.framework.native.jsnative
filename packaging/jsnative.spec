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
BuildRequires: pkgconfig(xwalk-extensions-common)
BuildRequires: pkgconfig(dlog)
BuildRequires: pkgconfig(libsmack)
BuildRequires: pkgconfig(cynara-client)
BuildRequires: pkgconfig(appcore-efl)
BuildRequires: pkgconfig(aul)
BuildRequires: pkgconfig(capi-appfw-application)
BuildRequires: pkgconfig(capi-appfw-app-manager)
BuildRequires: pkgconfig(pkgmgr-info)
BuildRequires: pkgconfig(bundle)
BuildRequires: pkgconfig(jsoncpp)


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
