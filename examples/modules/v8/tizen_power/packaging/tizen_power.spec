Name:       tizen_power
Summary:    Tizen Power Module
Version:    0.0.1
Release:    1
Group:      Development/Libraries
License:    Apache-2.0
URL:        https://www.tizen.org
Source0:    %{name}-%{version}.tar.gz
Source1:    %{name}.manifest

BuildRequires: cmake
BuildRequires: pkgconfig(capi-system-device)
BuildRequires: pkgconfig(dbus-glib-1)
BuildRequires: pkgconfig(deviced)
BuildRequires: pkgconfig(dlog)
BuildRequires: pkgconfig(nodejs)
BuildRequires: pkgconfig(vconf)
Requires: nodejs

%description
Sample implementation for Tizen Power API

%prep
%setup -q
cp %{SOURCE1} .

%build
mkdir -p cmake_build_tmp
cd cmake_build_tmp
cmake .. \
        -DCMAKE_INSTALL_PREFIX=%{_prefix}

make %{?jobs:-j%jobs}


%install
rm -rf %{buildroot}

mkdir -p %{buildroot}%{_datadir}/license
cp LICENSE %{buildroot}%{_datadir}/license/%{name}

cd cmake_build_tmp
%make_install

%clean
rm -rf %{buildroot}

%files
%manifest %{name}.manifest
%{_datadir}/license/%{name}
%{_prefix}/lib/node/*
