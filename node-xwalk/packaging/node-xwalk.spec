Name:       node-xwalk
Summary:    Crosswalk extension loader for Node.JS
Version:    0.9.0
Release:    1
Group:      Development/Libraries
License:    BSD-3-Clause
URL:        https:://github.com/WonyoungChoi/node-xwalk
Source0:    %{name}-%{version}.tar.gz
Source1:    %{name}.manifest

BuildRequires: cmake
BuildRequires: pkgconfig(nodejs)
Requires: nodejs

%description
Crosswalk Extension Loader for Node.JS allows you
to use crosswalk extensions in Node.JS environment.

%prep
%setup -q
cp %{SOURCE1} .

%build
mkdir -p cmake_build_tmp
cd cmake_build_tmp

cmake .. \
        -DCMAKE_INSTALL_PREFIX=%{prefix}

make %{?jobs:-j%jobs}

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}/usr/share/license
cp LICENSE %{buildroot}/usr/share/license/%{name}
cd cmake_build_tmp
%make_install

%clean
rm -rf %{buildroot}

%files
%manifest %{name}.manifest
%{_datadir}/license/%{name}
/usr/local/lib/node_modules/%{name}/*
