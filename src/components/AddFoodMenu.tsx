"use client"

import { useState } from "react"
import { Camera, ScanLine, PenSquare, Plus } from "lucide-react"

interface AddFoodMenuProps {
  onCameraClick: () => void
  onBarcodeClick: () => void
  onManualClick: () => void
}

export default function AddFoodMenu({ onCameraClick, onBarcodeClick, onManualClick }: AddFoodMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleOptionClick = (action: () => void) => {
    action()
    setIsOpen(false)
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setIsOpen(false)} />}

      {isOpen && (
        <div className="fixed bottom-24 left-0 right-0 z-50 flex items-end justify-center px-4">
          <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
            {/* Scan with Camera Card */}
            <button
              onClick={() => handleOptionClick(onCameraClick)}
              className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl flex flex-col items-center justify-center gap-3 h-28"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Camera className="w-6 h-6 text-gray-900" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium text-gray-900">Scan Camera</span>
            </button>

            {/* Scan Barcode Card */}
            <button
              onClick={() => handleOptionClick(onBarcodeClick)}
              className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl flex flex-col items-center justify-center gap-3 h-28"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <ScanLine className="w-6 h-6 text-gray-900" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium text-gray-900">Scan Barcode</span>
            </button>

            {/* Add Manually Card */}
            <button
              onClick={() => handleOptionClick(onManualClick)}
              className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl flex flex-col items-center justify-center gap-3 h-28 col-span-2"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <PenSquare className="w-6 h-6 text-gray-900" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium text-gray-900">Add Manually</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating + button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-6 w-16 h-16 bg-gray-900 hover:bg-gray-800 text-white rounded-full shadow-2xl flex items-center justify-center z-50"
        title="Add food"
        aria-label="Add food"
      >
        <Plus className="w-8 h-8" />
      </button>
    </>
  )
}
