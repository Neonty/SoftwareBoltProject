import { CalendarSearch, Building2, Info } from 'lucide-react';
import { SAMPLE_ROOMS, SAMPLE_BOOKINGS, SAMPLE_CURRENT_MINUTES, ALL_EQUIPMENT } from '@/data';
import { minutesToLabel } from '@/availability';
import { useRoomAvailability } from '@/useRoomAvailability';
import { RoomSelector, TimePicker, FilterBar } from '@/components/Controls';
import { ResultPanel } from '@/components/ResultPanel';
import { RoomSchedule } from '@/components/RoomSchedule';

function App() {
  const {
    minCapacity,
    setMinCapacity,
    requiredEquipment,
    toggleEquipment,
    filteredRooms,
    roomId,
    setRoomId,
    startLabel,
    setStartLabel,
    endLabel,
    setEndLabel,
    result,
    start,
    end,
    duration,
    selectedRoom,
    roomBookings,
    handleCheck,
    handleReset,
  } = useRoomAvailability({
    rooms: SAMPLE_ROOMS,
    bookings: SAMPLE_BOOKINGS,
    currentMinutes: SAMPLE_CURRENT_MINUTES,
    initialRoomId: SAMPLE_ROOMS[0].id,
    initialStartLabel: '11:00',
    initialEndLabel: '12:00',
  });

  const currentMinutes = SAMPLE_CURRENT_MINUTES;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-600 text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Smart Campus Room Availability</h1>
              <p className="text-sm text-slate-500">Check whether a room is free before you book it</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left: form */}
          <section className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
            <FilterBar
              minCapacity={minCapacity}
              onCapacityChange={setMinCapacity}
              equipmentOptions={ALL_EQUIPMENT}
              selectedEquipment={requiredEquipment}
              onToggleEquipment={toggleEquipment}
              matchCount={filteredRooms.length}
            />

            {filteredRooms.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Select a Room
                </label>
                <RoomSelector
                  rooms={filteredRooms}
                  selectedId={roomId}
                  onSelect={setRoomId}
                />
              </div>
            )}

            <TimePicker
              startLabel={startLabel}
              endLabel={endLabel}
              onStartChange={setStartLabel}
              onEndChange={setEndLabel}
            />

            {/* Quick info */}
            <div className="flex items-start gap-2 rounded-lg bg-sky-50 border border-sky-100 p-3 text-xs text-sky-800">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                Current time is set to <strong>{minutesToLabel(currentMinutes)}</strong> for this demo.
                Bookings may be up to 120 minutes, within 00:00–24:00, starting after the current time.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleCheck}
                disabled={filteredRooms.length === 0}
                className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-700 active:scale-[0.98] focus:ring-2 focus:ring-sky-500/30 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CalendarSearch className="w-5 h-5" />
                Check Availability
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98] outline-none"
              >
                Clear
              </button>
            </div>

            {/* Result */}
            <ResultPanel
              result={result}
              start={start}
              end={end}
              duration={duration}
              showDuration={duration > 0}
              roomName={selectedRoom?.name ?? ''}
            />
          </section>

          {/* Right: schedule */}
          <aside className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
            <h2 className="font-bold text-slate-800 mb-1">
              {selectedRoom ? selectedRoom.name : 'No Room Selected'} — Today's Schedule
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Existing bookings (unchanged by checking availability)
            </p>
            <RoomSchedule
              bookings={roomBookings}
              roomName={selectedRoom?.name ?? ''}
              currentMinutes={currentMinutes}
            />
          </aside>
        </div>

        <footer className="mt-8 text-center text-xs text-slate-400">
          Fictional sample data for demonstration only.
        </footer>
      </main>
    </div>
  );
}

export default App;
