import { useImagePickerStore } from '../store/imagePickerStore'
import ImagePickerDialog from './ImagePickerDialog'

/** Mounted once (App.tsx); renders the picker opened through `openImagePicker()`. */
export default function ImagePickerHost() {
  const current = useImagePickerStore(s => s.current)
  const pick    = useImagePickerStore(s => s.pick)
  const cancel  = useImagePickerStore(s => s.cancel)

  if (!current) return null

  return (
    <ImagePickerDialog
      title={current.title}
      exclude={current.exclude}
      onPick={pick}
      onCancel={cancel}
    />
  )
}
