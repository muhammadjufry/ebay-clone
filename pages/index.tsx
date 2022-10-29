import { BanknotesIcon, ClockIcon } from '@heroicons/react/24/outline';
import {
  useActiveListings,
  useContract,
  MediaRenderer,
} from '@thirdweb-dev/react';
import { ListingType } from '@thirdweb-dev/sdk';
import Header from '../components/Header';

const Home = () => {
  const { contract } = useContract(
    process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
    'marketplace'
  );
  const { data: listings, isLoading: loadingListings } =
    useActiveListings(contract);
  console.log(listings);
  return (
    <div className="">
      <Header />
      <main className="max-w-6xl mx-auto p-2 px-6">
        {loadingListings ? (
          <p className="text-center animate-pulse text-blue-500">
            Loading listings...
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mx-auto">
            {listings?.map((listing) => (
              <div
                key={listing.id}
                className="flex flex-col card hover:scale-105 transition-all duration-150 ease-out"
              >
                <div className="flex flex-1 flex-col pb-2 items-center">
                  <MediaRenderer
                    src={listing.asset.image}
                    className="w-full md:w-64"
                  />
                </div>
                <div className="pt-2 space-y-4">
                  <div>
                    <h2 className="text-2xl truncate font-medium mb-2">
                      {listing.asset.name}
                    </h2>
                    <hr />
                    <p className="truncate text-sm text-gray-600 mt-2">
                      {listing.asset.description}
                    </p>
                  </div>
                  <p>
                    <span className="font-bold mr-1">
                      {listing.buyoutCurrencyValuePerToken.displayValue}
                    </span>
                    {listing.buyoutCurrencyValuePerToken.symbol}
                  </p>
                  <div
                    className={`flex items-center space-x-1 justify-end text-sm border w-fit ml-auto p-2 px-4 rounded-lg text-white transition-all duration-150 ease-out ${
                      listing.type === ListingType.Direct
                        ? 'bg-blue-500 hover:bg-blue-900'
                        : 'bg-red-500 hover:bg-red-900'
                    }`}
                  >
                    <p>
                      {listing.type === ListingType.Direct
                        ? 'Buy Now'
                        : 'Auction'}
                    </p>
                    {listing.type === ListingType.Direct ? (
                      <BanknotesIcon className="h-4" />
                    ) : (
                      <ClockIcon className="h-4" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
