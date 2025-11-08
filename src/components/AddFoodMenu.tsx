"use client"

import { useState } from "react"
import { Camera, ScanLine, Plus, X } from "lucide-react"

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
      {isOpen && <div className="fixed inset-0 bg-black/20 z-40 transition-opacity" onClick={() => setIsOpen(false)} />}

      {isOpen && (
        <div className="fixed bottom-28 sm:bottom-32 left-1/2 transform -translate-x-1/2 flex flex-col gap-3 z-50">
          <button
            onClick={() => handleOptionClick(onCameraClick)}
            className="bg-white hover:bg-gray-50 text-emerald-600 rounded-full p-4 sm:p-5 shadow-2xl transition-all hover:scale-110 active:scale-95 flex items-center gap-3 pr-6"
            title="Scan with camera"
          >
            <Camera className="w-6 h-6 sm:w-7 sm:h-7" />
            <span className="text-sm sm:text-base font-medium">Scan with Camera</span>
          </button>

          <button
            onClick={() => handleOptionClick(onBarcodeClick)}
            className="bg-white hover:bg-gray-50 text-teal-600 rounded-full p-4 sm:p-5 shadow-2xl transition-all hover:scale-110 active:scale-95 flex items-center gap-3 pr-6"
            title="Scan barcode"
          >
            <ScanLine className="w-6 h-6 sm:w-7 sm:h-7" />
            <span className="text-sm sm:text-base font-medium">Scan Barcode</span>
          </button>

          <button
            onClick={() => handleOptionClick(onManualClick)}
            className="bg-white hover:bg-gray-50 text-blue-600 rounded-full p-4 sm:p-5 shadow-2xl transition-all hover:scale-110 active:scale-95 flex items-center gap-3 pr-6"
            title="Add manually"
          >
            <Plus className="w-6 h-6 sm:w-7 sm:h-7" />
            <span className="text-sm sm:text-base font-medium">Add Manually</span>
          </button>
        </div>
      )}

      <div className="fixed bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full p-5 sm:p-6 shadow-2xl transition-all hover:scale-110 active:scale-95 ${
            isOpen ? "rotate-45" : ""
          }`}
          title={isOpen ? "Close" : "Add food"}
        >
          {isOpen ? <X className="w-7 h-7 sm:w-8 sm:h-8" /> : <Plus className="w-7 h-7 sm:w-8 sm:h-8" />}
        </button>
      </div>
    </>
  )
}
