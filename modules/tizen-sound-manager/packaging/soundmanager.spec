Name:       tizen-sound-manager
Summary:    The JSNative module for SoundManager
Version:    0.0.1
Release:    1
Group:      Development/Libraries
License:    Apache-2.0 and BSD-3-Clause
URL:        https://www.tizen.org
Source0:    %{name}-%{version}.tar.gz
Source1:    %{name}.manifest
BuildRequires: ninja
BuildRequires: gyp_xwext
BuildRequires: pkgconfig(dlog)
%description
The JSNative module for SoundManager
%prep
%setup -q
cp %{SOURCE1} .
%build
export GYP_GENERATORS='ninja'
gyp_xwext build.gyp
ninja -C out/Default %{?_smp_mflags}
%install
rm -rf %{buildroot}
%define target_dir %{buildroot}/usr/lib/node/%{name}
mkdir -p %{target_dir}
install -p -m 644 package.json %{target_dir}
install -p -m 644 out/Default/tizen-sound-manager.xwalk %{target_dir}
%clean
rm -rf %{buildroot}
%files
%manifest %{name}.manifest
/usr/lib/node/%{name}