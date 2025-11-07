"use client"

import { useState, useEffect, useRef } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { supabase } from "../lib/supabase"
import { searchProductByBarcode, type ProductNutrition } from "../utils/openFoodFacts"
import { achievementService } from "../services/achievementService"
import {
  X,
  CheckCircle,
  AlertCircle,
  Loader,
  Flame,
  Beef,
  Cookie,
  Droplet,
  Wheat,
  Candy,
  Sparkles,
  Edit3,
} from "lucide-react"

interface BarcodeScannerProps {
  userId: string
  onClose: () => void
  onFoodLogged: () => void
}

export default function BarcodeScanner({ userId, onClose, onFoodLogged }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [productData, setProductData] = useState<ProductNutrition | null>(null)
  const [scannedBarcode, setScannedBarcode] = useState("")
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [cameraStarted, setCameraStarted] = useState(false)
  const [manualEntry, setManualEntry] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [editableData, setEditableData] = useState<ProductNutrition | null>(null)
  const [manualData, setManualData] = useState({
    foodName: "",
    servingSize: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
  })

  useEffect(() => {
    startScanner()
    return () => {
      stopScanner()
    }
  }, [])

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode("barcode-reader")
      scannerRef.current = scanner

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      }

      await scanner.start(
        { facingMode: "environment" },
        config,
        async (decodedText) => {
          await handleBarcodeScan(decodedText)
        },
        undefined,
      )
      setCameraStarted(true)
      setPermissionDenied(false)
    } catch (err: any) {
      console.error("Error starting scanner:", err)

      if (
        err.name === "NotAllowedError" ||
        err.message?.includes("Permission denied") ||
        err.message?.includes("NotAllowedError")
      ) {
        setPermissionDenied(true)
        setError("Camera access is required. Please enable camera permissions to scan barcodes.")
      } else if (err.message?.includes("NotSupportedError")) {
        setError("Your device does not support camera access or does not have a camera.")
      } else if (err.message?.includes("OverconstrainedError")) {
        setError("No camera found on your device.")
      } else {
        setError("Failed to access camera. Please check permissions and try again.")
      }
      setScanning(false)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current && cameraStarted) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch (err) {
        console.error("Error stopping scanner:", err)
      }
    }
  }

  const handleBarcodeScan = async (barcode: string) => {
    if (loading || productData) return

    setLoading(true)
    setScannedBarcode(barcode)
    setScanning(false)

    await stopScanner()

    try {
      const product = await searchProductByBarcode(barcode)

      if (product) {
        setProductData(product)
        setEditableData(product)
        setError("")
      } else {
        setError("Product not found in database. Please enter manually.")
      }
    } catch (err) {
      console.error("Error fetching product:", err)
      setError("Failed to fetch product information.")
    } finally {
      setLoading(false)
    }
  }

  const handleLogFood = async () => {
    const dataToLog = editableData || productData
    if (!dataToLog) return

    setLoading(true)
    setError("")

    try {
      const { error: insertError } = await supabase.from("food_logs").insert({
        user_id: userId,
        food_name: dataToLog.foodName,
        description: dataToLog.description,
        serving_size: dataToLog.servingSize,
        calories: dataToLog.calories,
        protein: dataToLog.protein,
        carbs: dataToLog.carbs,
        fats: dataToLog.fats,
        fiber: dataToLog.fiber,
        sugar: dataToLog.sugar,
        sodium: dataToLog.sodium,
      })

      if (insertError) throw insertError

      achievementService.checkAndAwardAchievements(userId).catch(console.error)

      onFoodLogged()
    } catch (err: any) {
      console.error("Error logging food:", err)
      setError(err.message || "Failed to log food. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRescan = async () => {
    setProductData(null)
    setEditableData(null)
    setScannedBarcode("")
    setError("")
    setManualEntry(false)
    setEditMode(false)
    setPermissionDenied(false)
    setManualData({
      foodName: "",
      servingSize: "",
      calories: "",
      protein: "",
      carbs: "",
      fats: "",
    })
    setScanning(true)
    await startScanner()
  }

  const handleManualEntry = () => {
    setError("")
    setManualEntry(true)
  }

  const toggleEditMode = () => {
    setEditMode(!editMode)
    if (!editMode && productData) {
      setEditableData({ ...productData })
    }
  }

  const handleManualSubmit = async () => {
    if (!manualData.foodName || !manualData.servingSize || !manualData.calories) {
      setError("Please fill in food name, serving size, and calories.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const { error: insertError } = await supabase.from("food_logs").insert({
        user_id: userId,
        food_name: manualData.foodName,
        serving_size: manualData.servingSize,
        calories: Number.parseFloat(manualData.calories) || 0,
        protein: Number.parseFloat(manualData.protein) || 0,
        carbs: Number.parseFloat(manualData.carbs) || 0,
        fats: Number.parseFloat(manualData.fats) || 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      })

      if (insertError) throw insertError

      achievementService.checkAndAwardAchievements(userId).catch(console.error)

      onFoodLogged()
    } catch (err: any) {
      console.error("Error logging food:", err)
      setError(err.message || "Failed to log food. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Scan Barcode</h2>
          <p className="text-sm text-white/90">Point camera at barcode</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {scanning && !permissionDenied && (
        <div className="flex-1 flex flex-col items-center justify-center bg-black">
          <div id="barcode-reader" className="w-full max-w-md" />
          <p className="text-white mt-4 text-center px-4">Position the barcode within the frame</p>
        </div>
      )}

      {loading && !productData && (
        <div className="flex-1 flex flex-col items-center justify-center bg-black">
          <Loader className="w-16 h-16 text-emerald-500 animate-spin mb-4" />
          <p className="text-white text-lg">Looking up product...</p>
          <p className="text-white/70 text-sm mt-2">Barcode: {scannedBarcode}</p>
        </div>
      )}

      {permissionDenied && (
        <div className="flex-1 flex flex-col items-center justify-center bg-black p-4">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <p className="text-white text-lg text-center mb-2">Camera Access Denied</p>
          <p className="text-white/70 text-sm text-center mb-6 max-w-xs">
            To scan barcodes, please enable camera permissions in your device settings and try again.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleRescan}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all font-medium"
            >
              Try Again
            </button>
            <button
              onClick={handleManualEntry}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all font-medium"
            >
              Enter Manually
            </button>
          </div>
        </div>
      )}

      {error && !productData && !manualEntry && !permissionDenied && (
        <div className="flex-1 flex flex-col items-center justify-center bg-black p-4">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <p className="text-white text-lg text-center mb-2">Unable to Find Product</p>
          <p className="text-white/70 text-sm text-center mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={handleRescan}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all"
            >
              Scan Again
            </button>
            <button
              onClick={handleManualEntry}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all"
            >
              Enter Manually
            </button>
          </div>
        </div>
      )}

      {manualEntry && (
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-emerald-50">
          <div className="max-w-md mx-auto p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Add Item Manually</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Food Name *</label>
                  <input
                    type="text"
                    value={manualData.foodName}
                    onChange={(e) => setManualData({ ...manualData, foodName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g., Chicken Breast"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity / Serving Size *</label>
                  <input
                    type="text"
                    value={manualData.servingSize}
                    onChange={(e) => setManualData({ ...manualData, servingSize: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g., 100g, 1 cup, 1 piece"
                  />
                </div>

                <div className="border-t-2 border-gray-100 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Nutrition Information</h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Calories (kcal) *</label>
                      <input
                        type="number"
                        value={manualData.calories}
                        onChange={(e) => setManualData({ ...manualData, calories: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Protein (g)</label>
                      <input
                        type="number"
                        value={manualData.protein}
                        onChange={(e) => setManualData({ ...manualData, protein: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none"
                        placeholder="0"
                        min="0"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Carbs (g)</label>
                      <input
                        type="number"
                        value={manualData.carbs}
                        onChange={(e) => setManualData({ ...manualData, carbs: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                        placeholder="0"
                        min="0"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fats (g)</label>
                      <input
                        type="number"
                        value={manualData.fats}
                        onChange={(e) => setManualData({ ...manualData, fats: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:outline-none"
                        placeholder="0"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border-2 border-red-200 text-red-600 text-sm rounded-xl">
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRescan}
                className="flex-1 px-6 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl shadow-lg transition-all"
              >
                Scan Again
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={loading}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add to Log"}
              </button>
            </div>
          </div>
        </div>
      )}

      {productData && (
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-emerald-50">
          <div className="max-w-md mx-auto p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-emerald-500 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Product Found</h3>
                    <p className="text-sm text-gray-600">Barcode: {scannedBarcode}</p>
                  </div>
                </div>
                <button onClick={toggleEditMode} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit3 className="w-5 h-5 text-emerald-600" />
                </button>
              </div>

              {!editMode ? (
                <>
                  <div className="border-t-2 border-gray-100 pt-4 mb-4">
                    <h4 className="font-bold text-lg text-gray-800 mb-1">{productData.foodName}</h4>
                    {productData.description !== productData.foodName && (
                      <p className="text-sm text-gray-600 mb-2">{productData.description}</p>
                    )}
                    <p className="text-sm text-gray-500">Serving: {productData.servingSize}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        <span className="font-medium text-gray-700">Calories</span>
                      </div>
                      <span className="font-bold text-gray-800">{productData.calories} kcal</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 bg-red-50 rounded-xl text-center">
                        <Beef className="w-5 h-5 text-red-500 mx-auto mb-1" />
                        <div className="text-xs text-gray-600">Protein</div>
                        <div className="font-bold text-gray-800">{productData.protein}g</div>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-xl text-center">
                        <Cookie className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                        <div className="text-xs text-gray-600">Carbs</div>
                        <div className="font-bold text-gray-800">{productData.carbs}g</div>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-xl text-center">
                        <Droplet className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                        <div className="text-xs text-gray-600">Fats</div>
                        <div className="font-bold text-gray-800">{productData.fats}g</div>
                      </div>
                    </div>

                    <div className="border-t-2 border-gray-100 pt-3">
                      <p className="text-xs font-medium text-gray-600 mb-2">Additional Info</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 bg-gray-50 rounded-lg text-center">
                          <Wheat className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                          <div className="text-xs text-gray-600">Fiber</div>
                          <div className="text-sm font-semibold text-gray-800">{productData.fiber}g</div>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg text-center">
                          <Candy className="w-4 h-4 text-pink-500 mx-auto mb-1" />
                          <div className="text-xs text-gray-600">Sugar</div>
                          <div className="text-sm font-semibold text-gray-800">{productData.sugar}g</div>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg text-center">
                          <Sparkles className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                          <div className="text-xs text-gray-600">Sodium</div>
                          <div className="text-sm font-semibold text-gray-800">{productData.sodium}mg</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="border-t-2 border-gray-100 pt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Food Name</label>
                    <input
                      type="text"
                      value={editableData?.foodName || ""}
                      onChange={(e) =>
                        setEditableData(editableData ? { ...editableData, foodName: e.target.value } : null)
                      }
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Serving Size</label>
                    <input
                      type="text"
                      value={editableData?.servingSize || ""}
                      onChange={(e) =>
                        setEditableData(editableData ? { ...editableData, servingSize: e.target.value } : null)
                      }
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Calories (kcal)</label>
                      <input
                        type="number"
                        value={editableData?.calories || 0}
                        onChange={(e) =>
                          setEditableData(
                            editableData ? { ...editableData, calories: Number.parseFloat(e.target.value) || 0 } : null,
                          )
                        }
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Protein (g)</label>
                      <input
                        type="number"
                        value={editableData?.protein || 0}
                        onChange={(e) =>
                          setEditableData(
                            editableData ? { ...editableData, protein: Number.parseFloat(e.target.value) || 0 } : null,
                          )
                        }
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Carbs (g)</label>
                      <input
                        type="number"
                        value={editableData?.carbs || 0}
                        onChange={(e) =>
                          setEditableData(
                            editableData ? { ...editableData, carbs: Number.parseFloat(e.target.value) || 0 } : null,
                          )
                        }
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fats (g)</label>
                      <input
                        type="number"
                        value={editableData?.fats || 0}
                        onChange={(e) =>
                          setEditableData(
                            editableData ? { ...editableData, fats: Number.parseFloat(e.target.value) || 0 } : null,
                          )
                        }
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:outline-none"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fiber (g)</label>
                      <input
                        type="number"
                        value={editableData?.fiber || 0}
                        onChange={(e) =>
                          setEditableData(
                            editableData ? { ...editableData, fiber: Number.parseFloat(e.target.value) || 0 } : null,
                          )
                        }
                        className="w-full px-2 py-1.5 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none text-sm"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Sugar (g)</label>
                      <input
                        type="number"
                        value={editableData?.sugar || 0}
                        onChange={(e) =>
                          setEditableData(
                            editableData ? { ...editableData, sugar: Number.parseFloat(e.target.value) || 0 } : null,
                          )
                        }
                        className="w-full px-2 py-1.5 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none text-sm"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Sodium (mg)</label>
                      <input
                        type="number"
                        value={editableData?.sodium || 0}
                        onChange={(e) =>
                          setEditableData(
                            editableData ? { ...editableData, sodium: Number.parseFloat(e.target.value) || 0 } : null,
                          )
                        }
                        className="w-full px-2 py-1.5 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none text-sm"
                        min="0"
                        step="1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRescan}
                className="flex-1 px-6 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl shadow-lg transition-all"
              >
                Scan Again
              </button>
              <button
                onClick={handleLogFood}
                disabled={loading}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add to Log"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
