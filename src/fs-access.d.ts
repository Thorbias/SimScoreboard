// File System Access API pieces that lib.dom does not declare yet.
interface DirectoryPickerOptions {
  id?: string;
  mode?: 'read' | 'readwrite';
}

interface Window {
  showDirectoryPicker?: (
    options?: DirectoryPickerOptions,
  ) => Promise<FileSystemDirectoryHandle>;
}

interface FileSystemHandle {
  queryPermission?: (descriptor?: {
    mode?: 'read' | 'readwrite';
  }) => Promise<PermissionState>;
  requestPermission?: (descriptor?: {
    mode?: 'read' | 'readwrite';
  }) => Promise<PermissionState>;
}
