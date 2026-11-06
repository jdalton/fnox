cmake_minimum_required(VERSION 3.25)
project(fnox_touch_id_preview LANGUAGES CXX OBJCXX)

if(NOT APPLE)
  message(FATAL_ERROR "The native Touch ID preview requires macOS")
endif()

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_OBJCXX_STANDARD 23)
set(CMAKE_OBJCXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_OBJCXX_EXTENSIONS OFF)

find_program(NODE_EXECUTABLE node REQUIRED)
set(GENERATED_DIR "${CMAKE_CURRENT_BINARY_DIR}/generated")
set(FINGERPRINT_HEADER "${GENERATED_DIR}/fingerprint-animation.generated.h")
add_custom_command(
  OUTPUT "${FINGERPRINT_HEADER}"
  BYPRODUCTS "${GENERATED_DIR}/theme.generated.h"
  COMMAND "${NODE_EXECUTABLE}" --experimental-strip-types
          "${CMAKE_CURRENT_SOURCE_DIR}/build-header.mts" "${GENERATED_DIR}"
  DEPENDS
    build-header.mts animation.mts native.mts theme.mts
    assets/geometry.svg assets/flow.json
  VERBATIM
)
add_custom_target(fnox-touch-id-preview-fingerprint DEPENDS "${FINGERPRINT_HEADER}")

add_executable(fnox-touch-id-preview MACOSX_BUNDLE EXCLUDE_FROM_ALL
  preview/approval.mm
  src/approval-readiness.cc
  src/approval-prompt.mm
  src/fingerprint-view.mm
  src/file-identity.cc
  src/input-policy.cc
  src/secret-buffer.cc
)
add_dependencies(fnox-touch-id-preview fnox-touch-id-preview-fingerprint)
target_include_directories(fnox-touch-id-preview PRIVATE
  src "${GENERATED_DIR}" generated
)
target_compile_definitions(fnox-touch-id-preview PRIVATE FNOX_TOUCH_PREVIEW=1)
target_compile_options(fnox-touch-id-preview PRIVATE
  $<$<COMPILE_LANGUAGE:OBJCXX>:-fobjc-arc>
)
target_link_libraries(fnox-touch-id-preview PRIVATE
  "-framework AppKit"
  "-framework Foundation"
  "-framework LocalAuthentication"
  "-framework LocalAuthenticationEmbeddedUI"
  "-framework QuartzCore"
  "-framework Security"
)
set_target_properties(fnox-touch-id-preview PROPERTIES
  MACOSX_BUNDLE_INFO_PLIST "${CMAKE_CURRENT_SOURCE_DIR}/Info.plist"
  MACOSX_BUNDLE_BUNDLE_NAME "Fnox Touch ID Preview"
  MACOSX_BUNDLE_GUI_IDENTIFIER "dev.jdx.fnox.touchid-preview"
  MACOSX_BUNDLE_SHORT_VERSION_STRING "0.1"
)
